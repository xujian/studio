import { GoogleGenAI } from '@google/genai'
import { JsonPrompt } from './types'
import * as prompts from './prompts'

interface CachedAnalysis {
  result: JsonPrompt
  timestamp: number
  expiresAt: number
}

export class ImageAnalyzer {
  private cache: Map<string, CachedAnalysis>
  private cacheTTL: number

  constructor(options?: { cacheTTL?: number }) {
    this.cache = new Map()
    this.cacheTTL = options?.cacheTTL || 30 * 60 * 1000 // 30 minutes default
  }

  async analyze(url: string): Promise<JsonPrompt> {
    // Check cache first
    const cached = this.getCached(url)
    if (cached) {
      console.log(`[ImageAnalyzer] Cache hit for ${url}`)
      return cached
    }
    // Cache miss - analyze
    console.log(`[ImageAnalyzer] Cache miss, analyzing ${url}`)
    const result = await this.fetchAndAnalyze(url)
    this.setCache(url, result)
    return result
  }

  private async fetchAndAnalyze(url: string): Promise<JsonPrompt> {
    // Fetch image
    const imageData = await this.fetchImageAsBase64(url)
    // Call Gemini Vision API
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        {
          parts: [
            { 
              inlineData: imageData
            }
          ]
        }
      ],
      config: {
        systemInstruction: prompts.IMAGE_ANALYZER_SYSTEM_PROMPT,
        responseModalities: ['TEXT'],
        temperature: 1,
        responseMimeType: 'application/json'
      }
    })
    const textResponse = response.candidates?.[0]?.content?.parts?.[0]?.text
    if (!textResponse) {
      throw new Error('No response from Gemini')
    }
    return this.parseAnalysisResponse(textResponse)
  }

  private async fetchImageAsBase64(url: string) {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }
    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mimeType = response.headers.get('content-type') || 'image/jpeg'
    return { mimeType, data: base64 }
  }

  private parseAnalysisResponse(textResponse: string): JsonPrompt {
    let jsonText = textResponse.trim()
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/^```json\s*/i, '')
    jsonText = jsonText.replace(/^```\s*/i, '')
    jsonText = jsonText.replace(/\s*```$/i, '')
    console.log('----XXXX-------IMAGE-ANALYZER---------------------------------RESULT', jsonText)
    // Extract JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No valid JSON object found in response')
    }
    jsonText = jsonMatch[0]
    // Parse JSON
    let parsed: any
    try {
      parsed = JSON.parse(jsonText)
    } catch (error) {
      console.error('JSON parse error:', error)
      console.error('Raw response:', textResponse)
      throw new Error('Failed to parse Gemini response as JSON')
    }
    // Validate basic structure
    const requiredSections = [
      'subject',
      'attire',
      'pose',
      'scene',
      'makeup',
      'lighting',
      'camera'
    ]
    for (const section of requiredSections) {
      if (!parsed[section] || typeof parsed[section] !== 'object') {
        throw new Error(`Missing or invalid section: ${section}`)
      }
    }
    return parsed as JsonPrompt
  }

  private getCached(url: string): JsonPrompt | null {
    this.cleanupExpired()

    const cached = this.cache.get(url)
    if (!cached) return null

    const now = Date.now()
    if (now > cached.expiresAt) {
      this.cache.delete(url)
      return null
    }
    return cached.result
  }

  private setCache(url: string, result: JsonPrompt): void {
    const now = Date.now()
    this.cache.set(url, {
      result,
      timestamp: now,
      expiresAt: now + this.cacheTTL
    })
  }

  private cleanupExpired(): void {
    const now = Date.now()
    for (const [url, cached] of this.cache.entries()) {
      if (now > cached.expiresAt) {
        this.cache.delete(url)
      }
    }
  }

  clearCache(url?: string): void {
    if (url) {
      this.cache.delete(url)
      console.log(`[ImageAnalyzer] Cleared cache for ${url}`)
    } else {
      this.cache.clear()
      console.log(`[ImageAnalyzer] Cleared entire cache`)
    }
  }

  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    }
  }
}

