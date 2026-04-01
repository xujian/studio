import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { extractError } from '@/lib/error'
import { z } from 'zod'
import { ASSET_ANALYZE_PROMPT } from '@/lib/prompts'
import { createClient } from '@/lib/supabase/server'
import { assetTypeNames, type AssetType } from '@/lib/types'
import { assetUrl } from '@/lib/utils'

const schema = z.object({
  type: z.enum(assetTypeNames as [AssetType, ...AssetType[]]),
  image: z.string().min(1), // storage path OR data URL
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  const body = await request.json()
  const validation = schema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { type, image } = validation.data
  const systemPrompt = ASSET_ANALYZE_PROMPT[type]
  if (!systemPrompt) {
    return NextResponse.json({ error: `Analyze not supported for type: ${type}` }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single()
  if (!profile || profile.credits < 1) {
    return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
  }

  let imgBase64: string
  let imgMime: string

  const isDataUrl = image.startsWith('data:')
  if (isDataUrl) {
    const [header, base64] = image.split(',')
    imgMime = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg'
    imgBase64 = base64
  } else {
    const imgRes = await fetch(assetUrl(image))
    if (!imgRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 400 })
    }
    const buffer = await imgRes.arrayBuffer()
    imgBase64 = Buffer.from(buffer).toString('base64')
    imgMime = imgRes.headers.get('content-type') || 'image/jpeg'
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

  let rawText: string
  try {
    const response = await ai.models.generateContent({
      model: process.env.NANO_BANANA_MODEL!,
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: imgMime, data: imgBase64 } },
          { text: `Analyze this image and write a prompt description for the ${type} as instructed.` }
        ]
      }],
      config: {
        systemInstruction: systemPrompt,
        responseModalities: ['TEXT'],
        temperature: 0.7,
      }
    })
    rawText = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
    if (!rawText) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }
  } catch (err) {
    console.error('[assets/analyze] generation failed', err)
    return NextResponse.json({ error: extractError(err).message }, { status: 500 })
  }

  // Try to parse JSON response (content, title, slug, description)
  let content = '', title = '', slug = '', description = ''
  try {
    const jsonText = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()
    const parsed = JSON.parse(jsonText)
    content = parsed.content || ''
    title = parsed.title || ''
    slug = parsed.slug || ''
    description = parsed.description || ''
  } catch {
    // Plain text response — use as content directly
    content = rawText
  }

  if (!content) {
    return NextResponse.json({ error: 'No content in response' }, { status: 500 })
  }

  // Deduct credit after successful analysis
  await supabase
    .from('profiles')
    .update({ credits: profile.credits - 1 })
    .eq('id', userId)
  await supabase.from('transactions').insert({
    user_id: userId,
    type: 'generation_cost',
    amount: -1,
    description: `Asset analyze: ${type}`
  })

  return NextResponse.json({ content, title, slug, description })
}
