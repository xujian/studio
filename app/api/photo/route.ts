import { NextRequest, NextResponse } from 'next/server'
import { withAxiom, logger } from '@/lib/axiom/server'
import { engine, type GenerateParams } from '@/lib/engine'
import { ratelimit } from '@/lib/ratelimit'
import { createClient } from '@/lib/supabase/server'
import type { AssetType, Mixins, Moment, MomentWithPhotos, Photo } from '@/lib/types'
import { engineRequestSchema } from '@/lib/validations'

// Configure route timeout for image generation (60 seconds)
export const maxDuration = 60

/**
 * Generate photo
 * @param request
 * @returns 
 */
export const POST = withAxiom(async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const start = Date.now()
  // 1. Parse and validate request body
    const body = await request.json()
    const validation = engineRequestSchema.safeParse(body)
    if (!validation.success) {
      logger.warn('photo.request.invalid', {
        error: validation.error.message
      })
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.message },
        { status: 400 }
      )
    }
    const input = validation.data
    const mode = input.momentId ? 'retry' : 'create'
    // 2. Authenticate user
    const supabase = await createClient()
    const {
      data: { session },
      error: authError
    } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id
    // Check credits before doing any work
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single()
    if (!profile || profile.credits < 1) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }
    // Rate limit: 10 generations per hour per user
    const { success, remaining } = await ratelimit.limit(userId)
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
      )
    }
    let momentId = input.momentId
    const mixins: Mixins = input.mixins as Mixins,
      /**
       * params to generate image
       */
      generateParams: Omit<GenerateParams, 'requestId'> = {
        userId,
        prompt: input.prompt,
        reference: input.reference,
        assets: {}
      },
      /**
       * data to save to photo record
       */
      photoData: Pick<Photo, 'prompt' | 'mixins'> = {
        prompt: null,
        mixins: null
      }
    // 3. If moment provided, verify ownership and fetch baseline prompt/mixins
    if (mode === 'create') {
      // Create new moment with baseline prompt and mixins
      const { data, error: momentError } = await supabase
        .from('moments')
        .insert({
          user_id: userId,
          prompt: input.prompt,
          reference: input.reference,
          mixins: mixins || null,
          status: 'completed'
        })
        .select()
        .single()
      if (momentError) {
        logger.error('moment.create.failed', { request_id: requestId, error: momentError.message })
        return halt(new Error(`Failed to create moment: ${momentError.message}`))
      }
      momentId = data.id
    } else {
      // it's a retry generation
      // load moment data to compare
      const { data: moment, error: momentError } = await supabase
        .from('moments')
        .select('user_id, prompt, reference, mixins')
        .eq('id', momentId)
        .single()
        .overrideTypes<Moment>()
      if (momentError) {
        return NextResponse.json({ error: 'Moment not found' }, { status: 404 })
      }
      if (moment.user_id !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
      // the prompt parameter is '' means
      // user did not modify the prompt
      // just use the moment prompt
      generateParams.prompt = input.prompt || moment.prompt
      generateParams.reference = moment.reference
      photoData.prompt = input.prompt
      if (mixins) {
        const diff: Record<string, string> = {}
        for (const [key, value] of Object.entries(mixins)) {
          if (value !== undefined && value !== moment.mixins?.[key as AssetType]) {
            diff[key] = value
          }
        }
        // Only save if there are differences
        if (Object.keys(diff).length > 0) {
          photoData.mixins = diff
        }
      }
    }
    const ids = mixins
      ? Object.entries(mixins).map(([, id]) => id)
      : []
    // load assets from Supabase
    const { data: assets, error: assetError } = await supabase
      .from('assets')
      .select('*')
      .in('id', ids)
    if (assetError || !assets) {
      logger.error('asset.load.failed', { request_id: requestId, ids })
      return halt(new Error(`asset not found: ${ids}`))
    }
    generateParams.assets = Object.fromEntries(assets.map(a => [a.type, a]))
    // 5. Call Engine to generate image
    let engineResult: Awaited<ReturnType<typeof engine.generate>>
    try {
      engineResult = await engine.generate({ ...generateParams, requestId })
    } catch (error) {
      return halt(error as Error)
    }
    const { image, title } = engineResult
    // 6. Convert base64 to buffer for upload
    const imageBuffer = Buffer.from(image, 'base64')
    const photoId = crypto.randomUUID()
    const storagePath = `${userId}/${momentId}/${photoId}.jpg`
    // 7. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      })
    if (uploadError) {
      logger.error('storage.upload.failed', { request_id: requestId, error: uploadError.message })
      return halt(new Error(`Storage upload failed: ${uploadError.message}`))
    }
    // 8. Insert photo record (url derived from userId/momentId/photoId)
    const { error: photoError } = await supabase.from('photos').insert({
      id: photoId,
      moment_id: momentId,
      prompt: photoData.prompt,
      mixins: photoData.mixins
    })
    if (photoError) {
      logger.error('photo.insert.failed', { request_id: requestId, error: photoError.message })
      return halt(new Error(`Failed to insert photo: ${photoError.message}`))
    }
    // 9. Save title to moment (only on create, retries keep original)
    if (mode === 'create' && title) {
      await supabase
        .from('moments')
        .update({ title })
        .eq('id', momentId)
    }
    // 10. Fetch complete moment with photos
    const { data: completeMoment, error: fetchError } = await supabase
      .from('moments')
      .select(`
        *,
        photos (*)
      `)
      .eq('id', momentId)
      .single()
    if (fetchError) {
      logger.error('moment.fetch.failed', { request_id: requestId, error: fetchError.message })
      return halt(new Error(`Failed to fetch moment: ${fetchError.message}`))
    }
    // logger.info('photo.generated', {
    //   request_id: requestId,
    //   userId,
    //   momentId,
    //   mode,
    //   latencyMs: Date.now() - start,
    // })
    return NextResponse.json(completeMoment as MomentWithPhotos)
})


function halt (error: Error) {
  console.error('Engine API error:', error)
  return NextResponse.json(
    {
      error: 'Generation failed',
      message: error instanceof Error
        ? error.message
        : 'Unknown error'
    },
    { status: 500 }
  )
}