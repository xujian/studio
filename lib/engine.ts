import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const FALLBACK_FACE_ID = process.env.FALLBACK_FACE_ID || ''

interface GenerateParams {
  prompt: string
  mixins?: { face?: string }
}

interface GenerateResult {
  imageData: string  // base64 encoded image
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

    if (!faceId) {
      throw new Error('No face ID provided and FALLBACK_FACE_ID not configured')
    }

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
    const imageResponse = await fetch(faceAsset.url)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch face image: ${imageResponse.statusText}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const imageBase64 = Buffer.from(imageBuffer).toString('base64')

    // 4. Call Gemini API with face + prompt (using image generation model)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' })

    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType: 'image/jpeg'
        }
      },
      {
        text: `Generate a high-quality portrait photo based on this reference image and prompt: ${prompt}`
      }
    ])

    // 5. Extract generated image from response
    const response = await result.response
    const generatedImage = extractGeneratedImage(response)

    return generatedImage
  }
}

/**
 * Extract base64 image data from Gemini response
 */
function extractGeneratedImage(response: any): GenerateResult {
  // Gemini 2.0 Flash returns images in parts
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
