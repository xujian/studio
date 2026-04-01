import type { AssetType, AssetWorkMode } from './types'



export const assetModes: Record<AssetType, AssetWorkMode> = {
  face: 'image-only',
  hair: 'text-first',
  outfit: 'text-first',
  makeup: 'text-only',
  scene: 'text-only',
  lighting: 'text-only',
  camera: 'text-only',
  mood: 'text-only'
}


export const assets: { id: AssetType; label: string; icon: string; mode: AssetWorkMode }[] = [
  {
    id: 'face',
    label: 'Face',
    icon: '/icons/face.png',
    mode: assetModes.face
  },
  {
    id: 'hair',
    label: 'Hair',
    icon: '/icons/hair.png',
    mode: assetModes.hair
  },
  {
    id: 'makeup',
    label: 'Makeup',
    icon: '/icons/makeup.png',
    mode: assetModes.makeup
  },
  {
    id: 'outfit',
    label: 'Outfit',
    icon: '/icons/outfit.png',
    mode: assetModes.outfit
  },
  {
    id: 'scene',
    label: 'Scene',
    icon: '/icons/scene.png',
    mode: assetModes.scene
  },
  {
    id: 'camera',
    label: 'Camera',
    icon: '/icons/camera.png',
    mode: assetModes.camera
  },
  {
    id: 'lighting',
    label: 'Lighting',
    icon: '/icons/lighting.png',
    mode: assetModes.lighting
  },
  {
    id: 'mood',
    label: 'Mood',
    icon: '/icons/mood.png',
    mode: assetModes.mood
  }
]