import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set')
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export const generateImage = async (prompt: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp'
    })

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: `Generate a high-quality portrait photograph with the following description: ${prompt}. Make it professional, well-lit, and aesthetically pleasing.`
        }]
      }]
    })

    // Extract image data from response
    // Note: This is a placeholder - actual implementation depends on Gemini's API response format
    const response = result.response
    const imageData = response.candidates?.[0]?.content?.parts?.[0]

    if (!imageData) {
      throw new Error('No image data in response')
    }

    // Return base64 data or URL depending on Gemini's response format
    // This will need adjustment based on actual Gemini API behavior
    return imageData.toString()
  } catch (error) {
    console.error('Gemini API error:', error)
    throw new Error('Failed to generate image')
  }
}
