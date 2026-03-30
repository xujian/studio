import type { AssetType, AssetWorkMode } from './types'

export const assetModes: Record<AssetType, AssetWorkMode> = {
  face: 'image-only',
  hair: 'text-first',
  outfit: 'text-first',
  makeup: 'text-only',
  scene: 'text-first',
  lighting: 'text-only',
  camera: 'text-only',
  mood: 'text-only'
}
