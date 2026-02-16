import { GoogleGenAI } from '@google/genai'
import type { Part } from '@google/genai'
import merge from 'lodash-es/merge'
import { ImageAnalyzer } from './image-analyzer'
import { TextAnalyzer } from './text-analyzer'
import AssetsBuilder from './assets-builder'
import { defaultAssets } from './constants'
import { Assets, AssetType, JsonPrompt } from './types'
import { uploadUrl } from './utils'
import { SYSTEM_PROMPT, TITLE_PROMPT } from './prompts'

export interface GenerateParams {
  userId: string
  prompt: string
  assets?: Assets
  reference?: string
}

interface GenerateResult {
  image: string // base64 encoded image
  mime: string
  title: string
}

/**
 * Engine module to handle photo generation logic
 * - Analyzes prompt and reference image to create structured json
 * - Builds assets and assembles final prompt for Gemini
 * - Calls Gemini API and extracts generated image
 */
export const engine = {
  /**
   * Generate a portrait photo via Gemini API
   *
   * Flow (per PRD):
   * 1. Analyze original inputs → structured json baseline
   *    - Reference image → ImageAnalyzer (full scene description)
   *    - Text prompt → PromptAnalyzer (only explicit mentions, merges on top)
   * 2. Build assets → image + text sections
   *    - Asset sections override analyzer json
   * 3. Assemble prompt → image parts + combined json
   * 4. Generate via Gemini → extract base64 image
   */
  generate: async ({
    userId,
    prompt,
    assets,
    reference
  }: GenerateParams): Promise<GenerateResult> => {
    // console.log('----------------ENGINE---------', prompt, reference, assets)
    const json: JsonPrompt = {},
      ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
    // 1. Analyze inputs into structured json
    merge(json, defaultAssets)
    if (reference) {
      const imageAnalyzer = new ImageAnalyzer(),
        image = uploadUrl(userId, reference)
      const result = await imageAnalyzer.analyze(image)
      merge(json, result)
    }
    if (prompt) {
      const promptAnalyzer = new TextAnalyzer()
      const result = await promptAnalyzer.analyze(prompt)
      merge(json, result)
    }
    // 2. Build assets — ensure face is always present
    // if (!assets?.face) {
    //   assets = { ...assets, face: defaultAssets.face }
    // }
    const { parts = [], sections = [] } = await AssetsBuilder.build(assets)
    sections.forEach(s => {
      json[s.key as AssetType] = s.content
    })
    // 3. Assemble prompt — face image parts + combined json
    const contents = [
      ...parts,
      {
        text: [
          'Generate a high-quality portrait photo with the following prompt:',
          JSON.stringify(json),
          '',
          `Before the image, respond with exactly one line: TITLE: <${TITLE_PROMPT}>`,
        ].join('\n')
      }
    ]
    console.log('============================BEFORE GENERATE=====prompt:', json, parts)
    // 4. Generate
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: '9:16',
          imageSize: '2K'
        }
      }
    })
    return extractGenerationResult(response)
  }
}

/**
 * Extract base64 image data from Gemini response
 */
function extractGenerationResult (response: any): GenerateResult {
  const parts = response.candidates?.[0]?.content?.parts || []
  let image = '', mime = '', title = ''
  for (const part of parts) {
    if (part.inlineData) {
      image = part.inlineData.data
      mime = part.inlineData.mimeType || 'image/png'
    }
    if (part.text) {
      const match = part.text.match(/TITLE:\s*(.+)/i)
      if (match) title = match[1].trim()
    }
  }
  if (!image) throw new Error('No image found in Gemini response')
  return { image, mime, title }
}
