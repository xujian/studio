import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { engine } from '@/lib/engine'
import { engineRequestSchema } from '@/lib/validations'
import type { MomentWithPhotos } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json()
    const validation = engineRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.message },
        { status: 400 }
      )
    }

    const { prompt, mixins, moment: momentId, promptEdited } = validation.data

    // 2. Authenticate user
    const supabase = await createClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // 3. If moment provided, verify ownership and fetch baseline prompt/mixins
    let momentBaseline: { prompt: string; mixins: Record<string, string> | null } | null = null

    if (momentId) {
      const { data: moment, error: momentError } = await supabase
        .from('moments')
        .select('user_id, prompt, mixins')
        .eq('id', momentId)
        .single()

      if (momentError) {
        return NextResponse.json(
          { error: 'Moment not found' },
          { status: 404 }
        )
      }
      if (moment.user_id !== userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }

      momentBaseline = {
        prompt: moment.prompt,
        mixins: moment.mixins as Record<string, string> | null
      }
    }

    // 4. Create or get moment ID first (before upload)
    let finalMomentId = momentId

    if (!momentId) {
      // Create new moment with baseline prompt and mixins
      const { data: newMoment, error: momentError } = await supabase
        .from('moments')
        .insert({
          user_id: userId,
          prompt: prompt,
          mixins: mixins || null,
          status: 'completed'
        })
        .select()
        .single()

      if (momentError) {
        throw new Error(`Failed to create moment: ${momentError.message}`)
      }

      finalMomentId = newMoment.id
    }

    // 5. Call Engine to generate image
    const { imageData, mimeType } = await engine.generate({
      prompt,
      mixins
    })

    // 6. Convert base64 to buffer for upload
    const imageBuffer = Buffer.from(imageData, 'base64')
    const photoId = crypto.randomUUID()
    const extension = mimeType === 'image/jpeg' ? 'jpg' : 'png'
    const storagePath = `${userId}/${finalMomentId}/${photoId}.${extension}`

    // 7. Upload to Supabase Storage (directly to final path)
    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(storagePath, imageBuffer, {
        contentType: mimeType,
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
    let photoPrompt: string | null = null
    let photoMixins: Record<string, string> | null = null

    if (momentBaseline) {
      // Retry mode: only save deltas
      // Prompt: use promptEdited flag from client
      if (promptEdited) {
        photoPrompt = prompt
      }

      // Mixins: compare key-by-key, save only differences
      if (mixins) {
        const diff: Record<string, string> = {}
        for (const [key, value] of Object.entries(mixins)) {
          if (value !== undefined && value !== momentBaseline.mixins?.[key]) {
            diff[key] = value
          }
        }
        // Only save if there are differences
        if (Object.keys(diff).length > 0) {
          photoMixins = diff
        }
      }
    }
    // New moment: prompt and mixins stay null (use moment's baseline)

    // 10. Insert photo record
    const { error: photoError } = await supabase
      .from('photos')
      .insert({
        id: photoId,
        moment_id: finalMomentId,
        url: urlData.publicUrl,
        storage_path: storagePath,
        prompt: photoPrompt,
        mixins: photoMixins
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
      .eq('id', finalMomentId)
      .single()

    if (fetchError) {
      throw new Error(`Failed to fetch moment: ${fetchError.message}`)
    }

    // 12. Return moment with photos
    return NextResponse.json(completeMoment as MomentWithPhotos)

  } catch (error) {
    console.error('Engine API error:', error)
    return NextResponse.json(
      {
        error: 'Generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
