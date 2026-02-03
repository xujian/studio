import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const FALLBACK_FACE_ID = process.env.FALLBACK_FACE_ID || ''

interface GenerateParams {
  userId: string
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
    userId,
    prompt,
    mixins
  }: GenerateParams): Promise<GenerateResult> => {
    // 1. Determine which face to use
    const faceId = mixins?.face || FALLBACK_FACE_ID

    if (!faceId) {
      throw new Error('No face ID provided and FALLBACK_FACE_ID not configured')
    }

    // 2. Retrieve face asset from database and verify user access
    const supabase = await createClient()

    // Use get_user_assets RPC to ensure user has access to this face
    const { data: userAssets, error: assetsError } = await supabase.rpc('get_user_assets', {
      user_uuid: userId
    })

    if (assetsError) {
      throw new Error(`Failed to fetch user assets: ${assetsError.message}`)
    }

    // Find the requested face in user's accessible assets
    const faceAsset = userAssets?.find((asset: any) => asset.id === faceId && asset.type === 'face')

    if (!faceAsset) {
      throw new Error(`Face asset not found or user does not have access: ${faceId}`)
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

    // 4. Call Gemini API with face + prompt
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

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
