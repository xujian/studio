import { GoogleGenAI } from '@google/genai'
import { createClient } from '@/lib/supabase/server'

const FALLBACK_FACE_ID = process.env.FALLBACK_FACE_ID || ''

interface GenerateParams {
  prompt: string
  mixins?: { face?: string }
}

interface GenerateResult {
  imageData: string // base64 encoded image
  mimeType: string
}

export const engine = {
  /**
   * Generate a photo using face + prompt via Gemini API
   */
  generate: async ({
    prompt,
    mixins
  }: GenerateParams): Promise<GenerateResult> => {
    // 1. Determine which face to use
    const faceId = mixins?.face || FALLBACK_FACE_ID

    // 2. Retrieve face asset from database
    const supabase = await createClient()
    const { data: faceAsset, error: assetError } = await supabase
      .from('assets')
      .select('url')
      .eq('id', faceId)
      .single()

    if (assetError || !faceAsset) {
      throw new Error(`Face asset not found: ${faceId}`)
    }

    if (!faceAsset.url) {
      throw new Error('Face asset has no URL')
    }

    // 3. Fetch face image as buffer
    const face = await fetch(faceAsset.url)
    if (!face.ok) {
      throw new Error(`Failed to fetch face image: ${face.statusText}`)
    }

    const faceBuffer = await face.arrayBuffer()
    const faceBase64 = Buffer.from(faceBuffer).toString('base64')

    // 4. Call Gemini API with face + prompt (using image generation model)
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!
    })
    const aspectRatio = '9:16'
    const resolution = '2K'
    const text = `Generate a high-quality portrait photo based on this reference image and prompt: ${prompt}`
    const contents = [
      { text },
      {
        inlineData: {
          data: faceBase64,
          mimeType: 'image/jpeg'
        }
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
        imageData: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/png'
      }
    }
  }
  throw new Error('No image found in Gemini response')
}
