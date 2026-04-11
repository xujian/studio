import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export const POST = async function POST(request: NextRequest) {
  const { prompt, language }: { prompt: string; language: string } = await request.json()

  if (!prompt || !language) {
    return NextResponse.json({ error: 'Missing prompt or language' }, { status: 400 })
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL!,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseModalities: ['TEXT'],
        systemInstruction: `Translate the following image generation prompt to ${language}. 
        Preserve all descriptive details exactly. Return only the translated text, nothing else.`,
      },
    })

    const content = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
    return NextResponse.json({ content })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : ''
    if (message.includes('503') || message.includes('UNAVAILABLE')) {
      return NextResponse.json({
        error: 'LLM model busy when translating'
      }, 
      {
        status: 503
      })
    }
    throw err
  }
}
