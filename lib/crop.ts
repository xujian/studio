import { GoogleGenAI } from '@google/genai'
import sharp from 'sharp'

const FACE_ERRORS: Record<string, string> = {
  no_face: 'No face detected. Please upload a photo with a clear face and shoulders.',
  face_covered: 'Face is covered or obscured. Please upload a photo where the face is fully visible.',
  face_unclear: 'Face is too unclear to process. Please upload a well-lit photo with a sharp, visible face.',
  face_not_frontal: 'Face must be looking directly at the camera. Please upload a front-facing photo.',
}

export type CropResult = Buffer | { error: string }

export async function cropFace(
  imgBuffer: Buffer,
  mimeType: string,
  ai: GoogleGenAI
): Promise<CropResult> {
  let bboxResponse: Awaited<ReturnType<typeof ai.models.generateContent>>
  try {
    bboxResponse = await ai.models.generateContent({
      model: process.env.NANO_BANANA_MODEL!,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: imgBuffer.toString('base64') } },
            {
              text: `Analyze the person's face orientation and location in this image.
Return ONLY a JSON object — choose exactly one case:

CASE 1 — frontal face (BOTH eyes clearly visible, face roughly symmetrical, not a side profile):
  {"found":true,"ymin":0,"xmin":0,"ymax":0,"xmax":0}
  Coordinates are 0-1000 normalized, covering from just above the top of the head to just below the shoulders, with generous side padding.

CASE 2 — face cannot be used, return one of:
  {"found":false,"reason":"no_face"}        — no person or face visible
  {"found":false,"reason":"face_covered"}   — face is masked, covered, or heavily obscured
  {"found":false,"reason":"face_unclear"}   — face present but too blurry, dark, or small to recognize
  {"found":false,"reason":"face_not_frontal"} — face is a side profile or turned away (only one eye visible, or face angle > ~30° from center)

A side profile or ¾ view where only one eye is visible MUST return face_not_frontal, never found:true.`
            }
          ]
        }
      ],
      config: { responseModalities: ['TEXT'] }
    })
  } catch {
    return { error: 'Face detection failed. Please try again.' }
  }

  const text =
    bboxResponse.candidates?.[0]?.content?.parts?.find(p => p.text)?.text ?? ''
  console.log('crop face bbox-------------------------------:', text)
  let bbox: {
    found: boolean
    reason?: string
    ymin?: number
    xmin?: number
    ymax?: number
    xmax?: number
  }
  try {
    bbox = JSON.parse(
      text
        .replace(/```json\s*/i, '')
        .replace(/```\s*/i, '')
        .trim()
    )
  } catch {
    return { error: 'Face detection failed. Please try again.' }
  }

  if (!bbox.found) {
    const msg = bbox.reason ? FACE_ERRORS[bbox.reason] : undefined
    return { error: msg ?? 'No usable face detected. Please upload a clear photo.' }
  }
  if (bbox.ymin == null) return { error: 'Face detection failed. Please try again.' }

  const { width = 1000, height = 1000 } = await sharp(imgBuffer).metadata()
  const left = Math.max(0, Math.floor((bbox.xmin! / 1000) * width))
  const top = Math.max(0, Math.floor((bbox.ymin / 1000) * height))
  const right = Math.min(width, Math.ceil((bbox.xmax! / 1000) * width))
  const bottom = Math.min(height, Math.ceil((bbox.ymax! / 1000) * height))
  const cropW = right - left
  const cropH = bottom - top

  if (cropW <= 0 || cropH <= 0) return { error: 'Face detection failed. Please try again.' }

  return sharp(imgBuffer)
    .extract({ left, top, width: cropW, height: cropH })
    .resize(1024, 1024, { fit: 'cover', position: 'top' })
    .jpeg({ quality: 95 })
    .toBuffer()
}
