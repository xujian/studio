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
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { prompt, mixins, moment: momentId } = validation.data

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

    // 3. If moment provided, verify ownership
    if (momentId) {
      const { data: moment, error: momentError } = await supabase
        .from('moments')
        .select('user_id')
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
    }

    // 4. Call Engine to generate image
    const { imageData, mimeType } = await engine.generate({
      prompt,
      mixins
    })

    // 5. Convert base64 to buffer for upload
    const imageBuffer = Buffer.from(imageData, 'base64')
    const photoId = crypto.randomUUID()
    const extension = mimeType === 'image/jpeg' ? 'jpg' : 'png'
    const storagePath = `${userId}/${momentId || 'temp'}/${photoId}.${extension}`

    // 6. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(storagePath, imageBuffer, {
        contentType: mimeType,
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`)
    }

    // 7. Get public URL
    const { data: urlData } = supabase.storage
      .from('photos')
      .getPublicUrl(storagePath)

    if (!urlData) {
      throw new Error('Failed to get public URL')
    }

    // 8. Create or update moment + insert photo
    let finalMomentId = momentId

    if (!momentId) {
      // Create new moment
      const { data: newMoment, error: momentError } = await supabase
        .from('moments')
        .insert({
          user_id: userId,
          prompt: prompt,
          status: 'completed'
        })
        .select()
        .single()

      if (momentError) {
        throw new Error(`Failed to create moment: ${momentError.message}`)
      }

      finalMomentId = newMoment.id

      // Update storage path with actual moment ID
      const correctPath = `${userId}/${finalMomentId}/${photoId}.${extension}`
      const { error: moveError } = await supabase.storage
        .from('photos')
        .move(storagePath, correctPath)

      if (moveError) {
        console.error('Failed to move file to correct path:', moveError)
        // Continue anyway, photo still works with temp path
      }
    }

    // 9. Insert photo record
    const { error: photoError } = await supabase
      .from('photos')
      .insert({
        id: photoId,
        moment_id: finalMomentId,
        url: urlData.publicUrl,
        storage_path: storagePath,
        mixins: mixins || null
      })

    if (photoError) {
      throw new Error(`Failed to insert photo: ${photoError.message}`)
    }

    // 10. Fetch complete moment with photos
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

    // 11. Return moment with photos
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
