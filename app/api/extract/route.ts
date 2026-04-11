import { NextRequest, NextResponse } from 'next/server'
import { TextAnalyzer } from '@/lib/text-analyzer'
import type { AssetType } from '@/lib/types'

export const POST = async function POST(request: NextRequest) {
  const { prompt, type }: { prompt: string; type: AssetType } = await request.json()

  if (!prompt || !type) {
    return NextResponse.json({ error: 'Missing prompt or type' }, { status: 400 })
  }

  const analyzer = new TextAnalyzer()
  try {
    const json = await analyzer.analyze(prompt)
    const value = json[type]
    if (!value) {
      return NextResponse.json({ content: '' })
    }
    const content = typeof value === 'string'
      ? value
      : JSON.stringify(value, null, 2)
    return NextResponse.json({ content })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : ''
    if (message.includes('503') || message.includes('UNAVAILABLE')) {
      return NextResponse.json({ error: 'LLM model busy when extracting' }, { status: 503 })
    }
    throw err
  }
}
