import { NextRequest, NextResponse } from 'next/server'
import { engine, type GenerateParams } from '@/lib/engine'
import { createClient } from '@/lib/supabase/server'
import type { Asset, Assets, AssetType, Mixins, Moment, MomentWithPhotos, Photo } from '@/lib/types'
import { engineRequestSchema } from '@/lib/validations'
import type { JsonPrompt } from '@/lib/types'

// Configure route timeout for image generation (60 seconds)
export const maxDuration = 60

/**
 * Generate photo
 * @param request
 * @returns 
 */
export async function POST(request: NextRequest) {
  
  // 1. Parse and validate request body
  const body = await request.json()
  const validation = engineRequestSchema.safeParse(body)
  if (!validation.success) {
    console.log('validate error', validation.error)
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
  let momentId = input.momentId,
    mixins: Mixins = input.mixins as Mixins,
    /**
     * params to generate image
     */
    generateParams: GenerateParams = {
      prompt: input.prompt,
      assets: {}
    },
    /**
     * data to save to photo record
     */
    photoData: Pick<Photo, 'prompt' | 'mixins'> = {
      prompt: null,
      mixins: null
    },
    // the final JSON prompt
    json: JsonPrompt = {}
  // 3. If moment provided, verify ownership and fetch baseline prompt/mixins
  if (mode === 'create') {
    // Create new moment with baseline prompt and mixins
    const { data, error: momentError } = await supabase
      .from('moments')
      .insert({
        user_id: userId,
        prompt: input.prompt,
        mixins: mixins || null,
        status: 'completed'
      })
      .select()
      .single()
    if (momentError) {
      throw new Error(`Failed to create moment: ${momentError.message}`)
    }
    momentId = data.id
  } else {
    // it's a retry generation
    // load moment data to compare
    const { data: moment, error: momentError } = await supabase
      .from('moments')
      .select('user_id, prompt, mixins')
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
    photoData.prompt = input.prompt || moment.prompt
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
    throw new Error(`asset not found: ${ids}`)
  }
  generateParams.assets = Object.fromEntries(assets.map(a => [a.type, a]))
  // 5. Call Engine to generate image
  const { image, mime } = await engine.generate(generateParams)
  // 6. Convert base64 to buffer for upload
  const imageBuffer = Buffer.from(image, 'base64')
  const photoId = crypto.randomUUID()
  const extension = mime === 'image/jpeg' ? 'jpg' : 'png'
  const storagePath = `${userId}/${momentId}/${photoId}.${extension}`
  // 7. Upload to Supabase Storage (directly to final path)
  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(storagePath, imageBuffer, {
      contentType: mime,
      upsert: false
    })
  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`)
  }
  // 8. Get public URL
  const { data: urlData } = supabase.storage
    .from('photos')
    .getPublicUrl(storagePath)
  if (!urlData) {
    throw new Error('Failed to get public URL')
  }
  // 9. Calculate photo prompt and mixins deltas
  // 10. Insert photo record
  const { error: photoError } = await supabase.from('photos').insert({
    id: photoId,
    moment_id: momentId,
    url: urlData.publicUrl,
    storage_path: storagePath,
    prompt: photoData.prompt,
    mixins: photoData.mixins
  })
  if (photoError) {
    throw new Error(`Failed to insert photo: ${photoError.message}`)
  }
  // 11. Fetch complete moment with photos
  const { data: completeMoment, error: fetchError } = await supabase
    .from('moments')
    .select(`
      *,
      photos (*)
    `)
    .eq('id', momentId)
    .single()
  if (fetchError) {
    throw new Error(`Failed to fetch moment: ${fetchError.message}`)
  }
  // 12. Return moment with photos
  return NextResponse.json(completeMoment as MomentWithPhotos)
}


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