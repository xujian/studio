export const FACE = 'facial features are 100% identical to'
export const MAKEUP = ''
export const ATTIRE = ''
export const POSE = ''
export const SCENE = ''
export const LIGHTING = ''
export const CAMERA = ''


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
  }
}`

export const SCHEMA = `{
  "subject": { "bodyType", "skinTone", "expression", "bodyLanguage" },
  "makeup": { "face", "eyes", "lips", "overall" },
  "attire": { "top", "bottom", "footwear", "accessories", "overall" },
  "pose": { "position", "limbs", "angle", "energy" },
  "scene": { "setting", "background", "foreground", "atmosphere" },
  "lighting": { "direction", "quality", "shadows", "highlights", "mood" },
  "camera": { "lens", "aperture", "angle", "framing", "focus", "style" }
}`