import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { promptSchema } from '@/lib/validations'
import { generateImage } from '@/lib/gemini'

export async function POST(request: Request) {
  try {
    // Verify authentication - getUser() validates JWT against Auth server
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = promptSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { prompt } = validation.data
    const userId = user.id

    // Generate image with Gemini
    let imageBase64: string
    try {
      imageBase64 = await generateImage(prompt)
    } catch (error) {
      // Insert failed generation record
      await supabase.from('generations').insert({
        user: userId,
        prompt,
        status: 'failed',
        error: 'Failed to generate image',
      })

      return NextResponse.json(
        { error: 'Failed to generate image' },
        { status: 500 }
      )
    }

    // Create generation record
    const { data: generation, error: insertError } = await supabase
      .from('generations')
      .insert({
        user: userId,
        prompt,
        status: 'completed',
      })
      .select()
      .single()

    if (insertError || !generation) {
      return NextResponse.json(
        { error: 'Failed to save generation' },
        { status: 500 }
      )
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageBase64, 'base64')

    // Upload to Supabase Storage
    const filePath = `${userId}/${generation.id}.png`
    const { error: uploadError } = await supabase.storage
      .from('generations')
      .upload(filePath, imageBuffer, {
        contentType: 'image/png',
        upsert: false,
      })

    if (uploadError) {
      // Update generation with error
      await supabase
        .from('generations')
        .update({
          status: 'failed',
          error: 'Failed to upload image'
        })
        .eq('id', generation.id)

      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('generations')
      .getPublicUrl(filePath)

    // Update generation with URL
    const { data: updatedGeneration, error: updateError } = await supabase
      .from('generations')
      .update({ url: publicUrl })
      .eq('id', generation.id)
      .select()
      .single()

    if (updateError || !updatedGeneration) {
      return NextResponse.json(
        { error: 'Failed to update generation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: updatedGeneration.id,
      url: updatedGeneration.url,
      prompt: updatedGeneration.prompt,
      created_at: updatedGeneration.created_at,
    })
  } catch (error) {
    console.error('Generate API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
