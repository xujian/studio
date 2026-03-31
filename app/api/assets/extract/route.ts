import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import sharp from 'sharp'
import { z } from 'zod'
import { cropFace } from '@/lib/crop'
import { ASSET_EXTRACT_SYSTEM_PROMPT } from '@/lib/prompts'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { assetTypeNames, type AssetType } from '@/lib/types'
import { assetUrl, random } from '@/lib/utils'

const schema = z.object({
  type: z.enum(assetTypeNames as [AssetType, ...AssetType[]]),
  image: z.string().min(1), // storage path OR data URL
  user_id: z.string().nullable().optional(),
})

const send = (controller: ReadableStreamDefaultController, event: object) => {
  controller.enqueue(
    new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`)
  )
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { session }
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  const body = await request.json()
  const validation = schema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { type, image, user_id } = validation.data
  const isDataUrl = image.startsWith('data:')
  const cropped = isDataUrl && image.includes(';cropped;')
  // console.log('extract/route-------------type:', type, isDataUrl, image.length)
  const systemPrompt = ASSET_EXTRACT_SYSTEM_PROMPT[type]

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single()
  if (!profile || profile.credits < 1) {
    return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
  }

  let imgBuffer: Buffer
  let imgMime: string

  if (isDataUrl) {
    const [header, base64] = image.split(',')
    imgMime = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg'
    imgBuffer = Buffer.from(base64, 'base64')
  } else {
    const imgRes = await fetch(assetUrl(image))
    if (!imgRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch uploaded image' }, { status: 400 })
    }
    imgBuffer = Buffer.from(await imgRes.arrayBuffer())
    imgMime = imgRes.headers.get('content-type') || 'image/jpeg'
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (type === 'face') {
          if (!cropped) {
            const cropResult = await cropFace(imgBuffer, imgMime, ai)
            if (!Buffer.isBuffer(cropResult)) {
              send(controller, { type: 'error', error: cropResult.error })
              controller.close()
              return
            }
            imgBuffer = cropResult as Buffer<ArrayBuffer>
            imgMime = 'image/jpeg'
            send(controller, {
              type: 'cropped',
              dataUrl: `data:image/jpeg;base64,${cropResult.toString('base64')}`
            })
          }
        }

        // Extract with Gemini
        let response: Awaited<ReturnType<typeof ai.models.generateContent>>
        try {
          response = await ai.models.generateContent({
            model: process.env.NANO_BANANA_MODEL!,
            contents: [{
              role: 'user',
              parts: [
                { inlineData: { mimeType: imgMime, data: imgBuffer.toString('base64') } },
                { text: `Extract and generate a preview image for this ${type} asset. You MUST also return the JSON text output as specified.` }
              ]
            }],
            config: {
              systemInstruction: systemPrompt,
              responseModalities: ['TEXT', 'IMAGE'],
              imageConfig: { aspectRatio: '1:1' }
            }
          })
        } catch (err) {
          console.error('[assets/extract] generation failed', err)
          send(controller, { type: 'error', error: 'Generation failed' })
          controller.close()
          return
        }

        const parts = response.candidates?.[0]?.content?.parts || []
        let imageBase64 = '', mime = 'image/png', textResponse = ''
        for (const part of parts) {
          if (part.inlineData) {
            imageBase64 = part.inlineData.data ?? ''
            mime = part.inlineData.mimeType || 'image/png'
          }
          if (part.text) textResponse += part.text
        }
        if (!imageBase64) {
          console.error('[assets/extract] no image in response')
          send(controller, { type: 'error', error: 'Generation refused' })
          controller.close()
          return
        }

        // Parse title, slug, description from text response
        let title = '', slug = '', description = ''
        try {
          const parsed = JSON.parse(
            textResponse.replace(/```json\s*/i, '').replace(/```\s*/i, '').trim()
          )
          title = parsed.title || ''
          slug = parsed.slug || ''
          description = parsed.description || ''
        } catch {
          const titleMatch = textResponse.match(/title:\s*(.+)/i)
          const slugMatch = textResponse.match(/slug:\s*(.+)/i)
          const descMatch = textResponse.match(/description:\s*(.+)/i)
          title = titleMatch?.[1]?.trim() || ''
          slug = slugMatch?.[1]?.trim() || ''
          description = descMatch?.[1]?.trim() || ''
        }

        // Compress and upload final image
        const inputBuffer = Buffer.from(imageBase64, 'base64')
        const compressed = await sharp(inputBuffer)
          .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer()

        const storagePath = user_id === null
          ? `${type}/${random()}.jpg`
          : `${userId}/${type}/${random()}.jpg`
        const storageClient = user_id === null
          ? createAdminClient()
          : supabase
        const { error: uploadError } = await storageClient.storage
          .from('assets')
          .upload(storagePath, compressed, { contentType: 'image/jpeg', upsert: false })
        if (uploadError) {
          console.error('[assets/extract] upload failed', uploadError)
          send(controller, { type: 'error', error: 'Upload failed' })
          controller.close()
          return
        }

        // Deduct credit after successful upload
        await supabase
          .from('profiles')
          .update({ credits: profile.credits - 1 })
          .eq('id', userId)
        await supabase.from('transactions').insert({
          user_id: userId,
          type: 'generation_cost',
          amount: -1,
          description: `Asset extract: ${type}`
        })

        send(controller, { type: 'completed', storagePath, title, slug, description })
        controller.close()
      } catch (err) {
        console.error('[assets/extract] unexpected error', err)
        send(controller, { type: 'error', error: 'Unexpected error' })
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}
