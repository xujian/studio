import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { extractError } from '@/lib/error'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  type: z.string(),
  content: z.string().optional(),
  storagePath: z.string().optional(), // path in Supabase Storage 'assets' bucket, already uploaded
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const validation = schema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { type, content, storagePath } = validation.data

  if (!content && !storagePath) {
    return NextResponse.json({ error: 'Provide content or storagePath' }, { status: 400 })
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

  const parts: object[] = []

  // Fetch image from Supabase Storage and pass as inline data
  if (storagePath) {
    const { data } = supabase.storage.from('assets').getPublicUrl(storagePath)
    const imageRes = await fetch(data.publicUrl)
    const buffer = await imageRes.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mimeType = imageRes.headers.get('content-type') || 'image/jpeg'
    parts.push({ inlineData: { data: base64, mimeType } })
  }

  const textPrompt = [
    `You are naming an asset of type "${type}" for an AI portrait photography app.`,
    content ? `Asset description: "${content}"` : '',
    storagePath ? 'An image of the asset is provided above.' : '',
    '',
    'Return ONLY a JSON object with two keys:',
    '- "name": a lowercase slug (e.g. "summer-casual", "soft-pink-makeup") — max 32 chars, no spaces',
    '- "title": a short human-readable label (e.g. "Summer Casual", "Soft Pink Makeup") — max 40 chars',
    '',
    'Example: {"name":"summer-casual","title":"Summer Casual"}',
  ].filter(Boolean).join('\n')

  parts.push({ text: textPrompt })

  try {
    const response = await ai.models.generateContent({
      model: process.env.NANO_BANANA_MODEL!,
      contents: [{ role: 'user', parts }],
    })

    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON in response')
    const result = JSON.parse(match[0])

    return NextResponse.json({
      name: String(result.name || '').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 32),
      title: String(result.title || '').slice(0, 40),
    })
  } catch (err) {
    console.error('[assets/suggest]', err)
    const { message, retryable } = extractError(err)
    return NextResponse.json({ error: message }, { status: retryable ? 503 : 500 })
  }
}
