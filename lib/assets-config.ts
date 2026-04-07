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

export type AssetPreviewMode = 'image' | 'svg'

export const assetPreviewModes: Record<AssetType, AssetPreviewMode> = {
  face: 'image',
  hair: 'image',
  outfit: 'image',
  makeup: 'image',
  scene: 'image',
  lighting: 'svg',
  camera: 'svg',
  mood: 'image'
}

export type AssetConfig = {
  id: AssetType;
  label: string;
  icon: string;
  mode: AssetWorkMode,
  previewMode: AssetPreviewMode
}

export const assets: AssetConfig[] = [
  {
    id: 'face',
    label: 'Face',
    icon: '/icons/face.png',
    mode: assetModes.face,
    previewMode: assetPreviewModes.face
  },
  {
    id: 'hair',
    label: 'Hair',
    icon: '/icons/hair.png',
    mode: assetModes.hair,
    previewMode: assetPreviewModes.hair
  },
  {
    id: 'makeup',
    label: 'Makeup',
    icon: '/icons/makeup.png',
    mode: assetModes.makeup,
    previewMode: assetPreviewModes.makeup
  },
  {
    id: 'outfit',
    label: 'Outfit',
    icon: '/icons/outfit.png',
    mode: assetModes.outfit,
    previewMode: assetPreviewModes.outfit
  },
  {
    id: 'scene',
    label: 'Scene',
    icon: '/icons/scene.png',
    mode: assetModes.scene,
    previewMode: assetPreviewModes.scene
  },
  {
    id: 'camera',
    label: 'Camera',
    icon: '/icons/camera.png',
    mode: assetModes.camera,
    previewMode: assetPreviewModes.camera
  },
  {
    id: 'lighting',
    label: 'Lighting',
    icon: '/icons/lighting.png',
    mode: assetModes.lighting,
    previewMode: assetPreviewModes.lighting
  },
  {
    id: 'mood',
    label: 'Mood',
    icon: '/icons/mood.png',
    mode: assetModes.mood,
    previewMode: assetPreviewModes.mood
  }
]