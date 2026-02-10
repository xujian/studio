

export const DEFAULTS = {
  FACE: 'https://rhxlulctluazrpqzooya.supabase.co/storage/v1/object/public/assets/face/ju.jpg',
  MAKEUP: '',
  ATTIRE: '',
  POSE: '',
  SCENE: '',
  LIGHTING: '',
  CAMERA: '',
  MOOD: ''
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
  "attire": {
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
  "attire": { "top", "bottom", "footwear", "accessories", "overall" },
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
- If the user says "sitting on a bench in a park", output only pose and scene — nothing about attire, makeup, lighting, or camera
- Be specific and vivid for what IS mentioned
- for descriptions in the user input but not matching the SCHEMA, extract and fill into the "extra" key

STEP 2. ***fix***: remove or overide according rules:
${FIXING}


STEP 3. output the target JSON prompt

Examples:
- "casual outdoor portrait" → { "scene": { "setting": "outdoors" }, "attire": { "overall": "casual" } }
- "sitting on a bench" → { "pose": { "position": "sitting on a bench" } }
- "red dress, golden hour" → { "attire": { "overall": "red dress" }, "lighting": { "quality": "golden hour" } }

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
* Photorealistic editorial photography
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