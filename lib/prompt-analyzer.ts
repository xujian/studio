import { GoogleGenAI } from '@google/genai'
import { EXAMPLE } from './prompts'
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
Convert the user's prompt into a ultra detailed structured JSON format prompt
that captures all aspects of their desired portrait photograph.

CRITICAL INSTRUCTIONS:
- Analyze the user's intent and expand it into detailed photography specifications
- If the prompt doesn't mention something, use professional defaults or leave as general description
- Be creative and infer reasonable details based on context
- Ignore and do NOT describe: face features, hair color/style, ethnicity, race, age, gender
- Focus on: clothing, pose, setting, technical aspects, mood, style
- Return ONLY valid JSON, no markdown formatting or code blocks

Required JSON structure:
${EXAMPLE}

Examples:
- User: "casual outdoor portrait" → Expand to garden setting, natural lighting, casual attire, relaxed pose
- User: "elegant evening photo" → Expand to formal attire, studio lighting, confident pose
- User: "sitting on a bench" → Keep pose, infer casual setting, natural lighting

Return only the JSON object, nothing else.`

// Singleton export
