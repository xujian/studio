import { GoogleGenAI } from '@google/genai'
import { SCHEMA } from './prompts'
import { JsonPrompt } from './types'

interface CachedAnalysis {
  result: JsonPrompt
  timestamp: number
  expiresAt: number
}

export class PromptAnalyzer {
  private cache: Map<string, CachedAnalysis>
  private cacheTTL: number

  constructor(options?: { cacheTTL?: number }) {
    this.cache = new Map()
    this.cacheTTL = options?.cacheTTL || 30 * 60 * 1000 // 30 minutes default
  }

  async analyze(prompt: string): Promise<JsonPrompt> {
    // Check cache first
    const cached = this.getCached(prompt)
    if (cached) {
      return cached
    }
    // Cache miss - analyze
    const result = await this.analyzePrompt(prompt)
    this.setCache(prompt, result)

    return result
  }

  private async analyzePrompt(prompt: string): Promise<JsonPrompt> {
    // Call Gemini to structure the prompt
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: `User prompt: ${prompt}` }
          ]
        }
      ],
      config: {
        responseModalities: ['TEXT'],
        temperature: 1,
        responseMimeType: 'application/json',
        systemInstruction: SYSTEM_PROMPT
      }
    })
    const textResponse = response.candidates?.[0]?.content?.parts?.[0]?.text
    console.log('prompt-analyzer---------------------------------result', textResponse)
    if (!textResponse) {
      throw new Error('No response from Gemini')
    }
    return this.parseAnalysisResponse(textResponse)
  }

  private parseAnalysisResponse(textResponse: string): JsonPrompt {
    let jsonText = textResponse.trim()

    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/^```json\s*/i, '')
    jsonText = jsonText.replace(/^```\s*/i, '')
    jsonText = jsonText.replace(/\s*```$/i, '')
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
    return parsed as JsonPrompt
  }

  private getCached(prompt: string): JsonPrompt | null {
    this.cleanupExpired()

    const cached = this.cache.get(prompt)
    if (!cached) return null

    const now = Date.now()
    if (now > cached.expiresAt) {
      this.cache.delete(prompt)
      return null
    }

    return cached.result
  }

  private setCache(prompt: string, result: JsonPrompt): void {
    const now = Date.now()
    this.cache.set(prompt, {
      result,
      timestamp: now,
      expiresAt: now + this.cacheTTL
    })
  }

  private cleanupExpired(): void {
    const now = Date.now()
    for (const [prompt, cached] of this.cache.entries()) {
      if (now > cached.expiresAt) {
        this.cache.delete(prompt)
      }
    }
  }

  clearCache(prompt?: string): void {
    if (prompt) {
      this.cache.delete(prompt)
      console.log(`[PromptAnalyzer] Cleared cache for prompt`)
    } else {
      this.cache.clear()
      console.log(`[PromptAnalyzer] Cleared entire cache`)
    }
  }

  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    }
  }
}

const SYSTEM_PROMPT =
`You are a professional portrait photography prompt analyzer.
Extract ONLY what the user explicitly mentions into structured JSON.

CRITICAL RULES:
- ONLY include sections and fields that the user directly mentions or clearly implies
- Do NOT invent, assume, or fill in defaults for anything not in the prompt
- If the user says "sitting on a bench in a park", output only pose and scene — nothing about attire, makeup, lighting, or camera
- Be specific and vivid for what IS mentioned
- Never describe: face features, hair color/style, ethnicity, race, age, gender
- Return ONLY valid JSON, no markdown

Available sections and fields (include only what applies):
${SCHEMA}

Examples:
- "casual outdoor portrait" → { "scene": { "setting": "outdoors" }, "attire": { "overall": "casual" } }
- "sitting on a bench" → { "pose": { "position": "sitting on a bench" } }
- "red dress, golden hour" → { "attire": { "overall": "red dress" }, "lighting": { "quality": "golden hour" } }

Return only the JSON object, nothing else.`

// Singleton export
