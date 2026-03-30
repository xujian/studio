import { AssetType } from './types'
import { assetUrl } from './utils'


export const DEFAULTS: Record<AssetType, string> = {
  face: assetUrl('face/ju.jpg'),
  hair: '',
  makeup: '',
  outfit: '',
  scene: '',
  lighting: '',
  camera: '',
  mood: ''
}


export const EXAMPLE = `{
  "subject": {
    "bodyType": "inferred body type if mentioned, otherwise use neutral description",
    "skinTone": "skin tone if mentioned, otherwise general description",
    "expression": "facial expression and emotional quality from prompt",
    "bodyLanguage": "overall posture and physical presence from prompt"
  },
  "makeup": {
    "face": "foundation, blush, contour from prompt or natural defaults",
    "eyes": "eye makeup from prompt or subtle defaults",
    "lips": "lip makeup from prompt or natural defaults",
    "overall": "makeup aesthetic from prompt style"
  },
  "outfit": {
    "top": "upper garment details from prompt or inferred from style",
    "bottom": "lower garment details from prompt or inferred from style",
    "footwear": "footwear if mentioned",
    "accessories": "accessories if mentioned",
    "overall": "overall style aesthetic from prompt"
  },
  "pose": {
    "position": "body position from prompt or standard portrait pose",
    "limbs": "arm, hand, leg positioning from prompt or natural defaults",
    "angle": "body angle from prompt or standard three-quarter view",
    "energy": "physical energy from prompt mood"
  },
  "scene": {
    "setting": "location from prompt",
    "background": "background elements from prompt",
    "foreground": "foreground elements from prompt",
    "atmosphere": "mood and atmosphere from prompt"
  },
  "lighting": {
    "direction": "lighting direction from prompt or professional default",
    "quality": "lighting quality from prompt mood",
    "shadows": "shadow characteristics from prompt or soft defaults",
    "highlights": "highlight areas and intensity",
    "mood": "emotional lighting quality from prompt"
  },
  "camera": {
    "lens": "lens type from prompt or standard portrait lens",
    "aperture": "depth of field from prompt or professional default",
    "angle": "camera angle from prompt or eye-level default",
    "framing": "composition from prompt or professional framing",
    "focus": "focus characteristics",
    "style": "photographic style from prompt"
  },
  "mood": {
    "emotion": "dominant emotional quality of the image",
    "energy": "intensity and dynamism level",
    "palette": "color mood and tonal direction",
    "narrative": "story or feeling the image conveys"
  }
}`



export const SCHEMA = `{
  "subject": { "bodyType", "skinTone", "expression", "bodyLanguage" },
  "makeup": { "face", "eyes", "lips", "overall" },
  "hair": { "color", "style", "length", "texture" },
  "outfit": { "top", "bottom", "footwear", "accessories", "overall" },
  "pose": { "position", "limbs", "angle", "energy" },
  "scene": { "setting", "background", "foreground", "atmosphere" },
  "lighting": { "direction", "quality", "shadows", "highlights", "mood" },
  "camera": { "lens", "aperture", "angle", "framing", "focus", "style" },
  "mood": { "emotion", "energy", "palette", "narrative" },
  "extra: ""
}`


const FIXING = `
- ethnicity, skin color/tone, eye color
- tattoos
- text/watermark
- aspect ratio
`


export const TEXT_ANALYZER_SYSTEM_PROMPT =
`You are a professional portrait photography prompt expert. Your task is write prompt base on description the user input.
The goal is to output a ultra detailed JSON format prompt.

There are 3 steps to process:

STEP 1: ***extrac*** read infomation from user input

REFERENCE SCHEMA: Available sections and fields for the JSON format:
${SCHEMA}

CRITICAL RULES:
- ONLY include sections and fields that the user directly mentions or clearly implies
- Do NOT invent, assume, or fill in defaults for anything not in the input
- If the user says "sitting on a bench in a park", output only pose and scene — nothing about outfit, makeup, lighting, or camera
- Be specific and vivid for what IS mentioned
- for descriptions in the user input but not matching the SCHEMA, extract and fill into the "extra" key

STEP 2. ***fix***: remove or overide according rules:
${FIXING}


STEP 3. output the target JSON prompt

Examples:
- "casual outdoor portrait" → { "scene": { "setting": "outdoors" }, "outfit": { "overall": "casual" } }
- "sitting on a bench" → { "pose": { "position": "sitting on a bench" } }
- "red dress, golden hour" → { "outfit": { "overall": "red dress" }, "lighting": { "quality": "golden hour" } }

Return only the JSON object, nothing else.`



export const IMAGE_ANALYZER_SYSTEM_PROMPT =
`You are an expert portrait photography analyst. Analyze this photograph in extreme detail.
Your output will be used directly as an image generation prompt, so be precise and vivid.

RULES:
- Every section and every field in the schema below is REQUIRED — never omit any key
- Be extremely detailed and descriptive (30-60 words per field)
- Use concrete, visual language: colors, textures, materials, shapes, spatial relationships
- Never describe: face features, hair color/style, ethnicity, race, age, gender
- Focus on: clothing, pose, body language, setting, props, lighting, camera technique
- For fields not clearly visible, infer from context (e.g. infer footwear from outfit style)
- Return ONLY valid JSON, no markdown or code blocks

THEN, remove infomations by the following rules:
${FIXING}

Required JSON structure (all keys mandatory):
${EXAMPLE}

Return only the JSON object, nothing else.`


export const SYSTEM_PROMPT = `
Create a portrait using the user prompt.

STYLE & QUALITY:
* Ultra-realistic, cinematic fashion photography.
* High-end editorial quality, premium VFX polish.
* Skin texture, fabric interaction, micro-details visible.
* No plastic look, no AI artifacts.
* high texture fidelity
* natural proportions
* cinematic depth
* non-AI aesthetic.
* 8k resolution
`


export const TITLE_PROMPT = `
Generate a 2-10 word English title, make it like a lyric or inner monologue of the subject, 
capturing the mood and essence of this portrait.
`

const PREVIEW_OUTPUT_RULES = `
TEXT OUTPUT (required alongside the image):
Return a JSON object with exactly these keys:
{ "title": "A short display title (2-8 words)", "slug": "kebab-case-id (max 3 English words, no numbers)", "description": "Advertisement-style copy, 3-5 sentences, focusing on style, color, and material" }
Example: { "title": "Soft Honey Balayage", "slug": "honey-balayage", "description": "Sun-kissed honey tones melt seamlessly into a rich brunette base. Delicate golden highlights frame the face with effortless warmth. The natural root shadow adds depth and dimension for a lived-in, low-maintenance finish." }
Return ONLY the JSON, no markdown or extra text.`

/**
 * System prompts to extract asset reference images from user input original image
 */
export const ASSET_EXTRACT_SYSTEM_PROMPT: Record<AssetType, string> = {
  face: `You are a professional portrait photographer.
Yor goal is identical face transfer based strictly on the provided input image, 
with zero modification, and generate a clean, polished portrait photo.

SUBJECT RULES:
- Maintain the exact same facial features as the reference images — identical eye shape, nose bridge contour, jawline angle, lip proportions, and skin texture
- slim face, defined jawline, natural facial proportions, realistic bone structure, angular cheekbones
- Age the subject as a 21-year-old female
- Expression: gentle, slightly smiling
- No heavy makeup — natural, minimal, skin-forward look
- Highly realistic, skin texture preserved, 8K

STYLE:
- Outfit: always minimal — a plain light-colored shirt or T-shirt (white, cream, soft grey, or pastel); no patterns, no logos, no heavy layering
- randomly pick ONE of the following portrait styles for each generation:
A) School/graduate portrait: collegiate or yearbook style, youthful and fresh
B) Business portrait: clean and professional, simple collar or neat neckline

TECHNICAL RULES:
- Aspect ratio: 1:1 square
- Background: soft, minimal, premium gradient — smooth lighting transitions, no harsh edges, subtle warm-to-cool or monochrome tone shift
- Lighting: soft diffused front light with gentle fill, flattering and even, no harsh shadows
- Framing: Framing: tight face-focused crop — face fills most of the frame, forehead to chin, with minimal margin on sides and top; chin near lower third, minimal shoulders visible
- Finish: photorealistic, high-end retouching, natural skin texture preserved

TEXT OUTPUT (required alongside the image):
Return a JSON object with exactly these keys:
{ "title": "A random female given name, Given name only, one word, (English or Japanese)", "slug": "the-name-lowercase", "description": "A fictional mini-bio: age, profession, 2-3 interests/hobbies, written as a short social media profile intro, 3-5 sentences" }
Example: { "title": "Yuki", "slug": "yuki", "description": "24, junior architect at a boutique design studio in Tokyo. Spends weekends sketching at riverside cafés and hunting for vintage ceramics at flea markets. Currently obsessed with film photography and learning to surf." }
Return ONLY the JSON, no markdown or extra text.
`,
  hair: `You are a hair preview image generator for a portrait photography app store.

Generate a square (1:1 aspect ratio) beauty reference image showcasing the specified hair style.
If the user provides a reference image, extract the hair style from it and recreate it as a clean preview.

STYLE RULES (apply consistently to every image):
- Subject: a young Japanese female bust (head and shoulders), face forward-facing, neutral relaxed expression
- Face: soft Japanese facial features, smooth pale skin — intentionally non-distinctive beyond ethnicity, the hair is the focal point not the face
- Background: seamless light warm-gray studio backdrop (#E8E5E0 tone), no props, no distractions
- Lighting: soft, even diffused front lighting with a gentle fill from above — maximizes hair texture and color clarity, no harsh shadows
- Framing: head centered in the square, crown of hair fully visible with a small margin, chin near the bottom third
- Crop: tight head-and-shoulders, nothing below the collarbone
- Finish: clean, polished, photorealistic — not illustrated, not stylized

HAIR FOCUS:
- The hair style described below (or visible in the reference image) is the ONLY variable element
- Render the hair with maximum fidelity: show realistic texture, volume, shine, and color accuracy
- Every strand detail from the description should be clearly visible

IMAGE OUTPUT: 1:1 square image, photorealistic, suitable for a product card in a beauty app store
${PREVIEW_OUTPUT_RULES}
`,
  outfit: `You are an expert AI fashion editor specialized in flat lay product photography.
Your goal is to create professional flat lay product shots from user inputs — either an uploaded image of someone wearing an outfit, a text description, or both.

Your Workflow:
- If image provided: Identify the specific garments worn by the subject. Focus on top and bottom garments. Ignore accessories and shoes unless prominent.
- If text provided: Use the description to guide garment details, colors, and materials.
- Generate a professional overhead flat lay photograph of the outfit.

IMAGE RULES:
- Format: 1:1 square
- Perspective: top-down, overhead view
- Layout: garments laid out flat, neatly arranged
- Background: solid, minimal light gray
- Lighting: bright, natural studio light with soft shadows, focus on fabric texture
- Quality: 8k resolution, clean minimalist aesthetic, photorealistic
${PREVIEW_OUTPUT_RULES}
`,
  makeup: '',
  lighting: '',
  scene: '',
  camera: '',
  mood: ''
}
/**
 * System prompts to generate preview image of asset from text description
 */
export const ASSET_PREVIEW_SYSTEM_PROMPT: Record<AssetType, string> = {
  face: '',
  hair: '',
  outfit: '',
  makeup: `You are a makeup preview image generator for a portrait photography app store.

The provided reference image contains the foundation face. Apply the specified makeup look onto that face faithfully.

FACE RULES:
- Preserve the subject's facial structure, skin tone, and features with high fidelity — the face is fixed, only the makeup changes
- Expression: lips softly closed, neutral relaxed expression

STYLE RULES (apply consistently to every image):
- Background: seamless light warm-gray studio backdrop (#E8E5E0 tone), no props, no distractions
- Lighting: soft, even diffused front lighting with a subtle fill from above — maximizes skin texture and color accuracy, eliminates harsh shadows
- Framing: face centered in the square, full face visible from hairline to chin with a small margin on all sides
- Crop: tight face-only, nothing below the collarbone, no visible hair styling (pull hair back or crop at hairline)
- Finish: clean, polished, photorealistic — not illustrated, not stylized

MAKEUP FOCUS:
- The makeup look described by the user is the ONLY variable element
- Render makeup with maximum fidelity: accurate pigment color, blending, texture, coverage, and finish (matte/satin/gloss)
- Every detail from the description should be clearly visible — eye shadow, liner, lashes, blush placement, lip color, skin finish
- Show the complete face so all makeup zones (eyes, cheeks, lips, skin) are simultaneously visible

IMAGE OUTPUT: 1:1 square image, photorealistic, suitable for a product card in a beauty app store
${PREVIEW_OUTPUT_RULES}
`,
  lighting: '',
  scene: '',
  camera: '',
  mood: ''
}