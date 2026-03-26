import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import sharp from 'sharp'
import { z } from 'zod'
import { ASSET_PREVIEW_SYSTEM_PROMPT } from '@/lib/prompts'
import { createClient } from '@/lib/supabase/server'
import { assetTypeNames, type AssetType } from '@/lib/types'
import { random } from '@/lib/utils'

const schema = z.object({
  type: z.enum(assetTypeNames as [AssetType, ...AssetType[]]),
  content: z.string().min(1),
})

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

  const { type, content } = validation.data
  const systemPrompt = ASSET_PREVIEW_SYSTEM_PROMPT[type]
  if (!systemPrompt) {
    return NextResponse.json(
      { error: 'Preview not supported for this asset type' },
      { status: 400 }
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single()
  if (!profile || profile.credits < 1) {
    return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

  let response: Awaited<ReturnType<typeof ai.models.generateContent>>
  try {
    response = await ai.models.generateContent({
      model: process.env.NANO_BANANA_MODEL!,
      contents: [{ role: 'user', parts: [{ text: content }] }],
      config: {
        systemInstruction: systemPrompt,
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: { aspectRatio: '1:1' }
      }
    })
  } catch (err) {
    console.error('[assets/preview] generation failed', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
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
    console.error('[assets/preview] no image in response')
    return NextResponse.json({ error: 'Generation refused' }, { status: 500 })
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

  // Compress: max 1024x1024, JPEG 85%
  const inputBuffer = Buffer.from(imageBase64, 'base64')
  const compressed = await sharp(inputBuffer)
    .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer()

  const storagePath = `${userId}/${type}/${random()}.jpg`
  const { error: uploadError } = await supabase.storage
    .from('assets')
    .upload(storagePath, compressed, { contentType: 'image/jpeg', upsert: false })
  if (uploadError) {
    console.error('[assets/preview] upload failed', uploadError)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
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
    description: `Asset preview: ${type}`
  })

  return NextResponse.json({ storagePath, title, slug, description })
}
