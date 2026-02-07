import { GoogleGenAI } from '@google/genai'
import type { Part } from '@google/genai'
import merge from 'lodash-es/merge'
import * as prompts from '@/lib/prompts'
import { createClient } from '@/lib/supabase/server'
import { ImageAnalyzer } from './image-analyzer'
import { PromptAnalyzer } from './prompt-analyzer'
import { Asset, Assets, AssetType, JsonPrompt } from './types'

const FALLBACK_FACE_ID = process.env.FALLBACK_FACE_ID || ''

export interface GenerateParams {
  prompt: string
  assets?: Assets
  reference?: string
}

interface GenerateResult {
  image: string // base64 encoded image
  mime: string
}

export const engine = {
  /**
   * Generate a photo using face + prompt via Gemini API
   */
  generate: async ({
    prompt,
    assets,
    reference
  }: GenerateParams): Promise<GenerateResult> => {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')
    const userId = session.user.id

    // fetch and process assets one by one
    const { parts = [], sections = [] } = await buildAssets(assets)
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!
    })
    const aspectRatio = '9:16',
      resolution = '2K',
      prompts: any = {}
    sections.forEach(s => {
      prompts[s.key] = s.content
    })
    let json: JsonPrompt = {}
    if (reference) {
      const imageAnalyzer = new ImageAnalyzer(),
        image = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${userId}/${reference}`
      // Only reference image provided
      try {
        const result = await imageAnalyzer.analyze(image)
        merge(json, result)
      } catch (error) {
        console.error('[Engine] Reference analysis failed:', error)
      }
    }
    if (prompt) {
      const promptAnalyzer = new PromptAnalyzer()
      try {
        const result = await promptAnalyzer.analyze(prompt)
        merge(json, result)
      } catch (error) {
        console.error('[Engine] Prompt analysis failed:', error)
      }
    }
    const contents = [
      ...parts,
      {
        text: [
          `Generate a high-quality portrait photo\n`,
          `JSON.stringify(sections)\n`,
          `based on the following prompt:\n`,
          JSON.stringify(json),
        ].join('\n')
      }
    ]
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: resolution
        }
      }
    })
    const generatedImage = extractGeneratedImage(response)
    return generatedImage
  }
}

/**
 * Extract base64 image data from Gemini response
 */
function extractGeneratedImage(response: any): GenerateResult {
  const parts = response.candidates?.[0]?.content?.parts || []
  for (const part of parts) {
    if (part.inlineData) {
      return {
        image: part.inlineData.data,
        mime: part.inlineData.mimeType || 'image/png'
      }
    }
  }
  throw new Error('No image found in Gemini response')
}

/**
 * build prompt from mixins
 */
async function buildAssets(assets?: Assets): Promise<{
  parts: (string | Part)[]
  sections: {
    key: string
    content: string
  }[]
}> {
  const parts: (string | Part)[] = [],
    sections: {
      key: string
      content: string
    }[] = []
  if (!assets) {
    return { parts, sections }
  }
  // default mixin content
  for (const [type, asset] of Object.entries(assets)) {
    const method = assetMethods.get(type as AssetType)
    if (method) {
      const result = await method(asset)
      sections.push({
        key: type as string,
        content: result.text
      })
      if (result.image) {
        // asset is an image
        parts.push(`reference ${type}:`)
        parts.push(result.image!)
      }
    }
  }
  return { parts, sections }
}

async function buildFace(asset: Asset) {
  const inlineData = await fetchImage(asset.url!)
  return {
    image: {
      inlineData
    },
    text: `${prompts.FACE} the "reference face"`
  }
}

async function buildMakeup(asset: Asset) {
  if (asset.url) {
    const inlineData = await fetchImage(asset.url)
    return {
      image: {
        inlineData
      },
      text: `${prompts.FACE} the "reference makeup"`
    }
  } else {
    return Promise.resolve({
      text: asset.content!
    })
  }
}

const assetMethods = new Map<
  AssetType,
  (asset: Asset) => Promise<{
    image?: Part
    text: string
  }>
>()
assetMethods.set('face', buildFace)
assetMethods.set('makeup', buildMakeup)

async function fetchImage(url: string): Promise<{
  mimeType: string
  data: string
}> {
  const image = await fetch(url)
  if (!image.ok) {
    throw new Error(`Failed to fetch face image: ${image.statusText}`)
  }
  const buffer = await image.arrayBuffer()
  const data = Buffer.from(buffer).toString('base64')
  return {
    mimeType: image.headers.get('content-type') || 'image/jpeg',
    data
  }
}
