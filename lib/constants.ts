import { Asset, Assets, AssetType } from "./types"

export const assetTypes = [
  { name: 'Face', type: 'face' },
  { name: 'Makeup', type: 'makeup' },
  { name: 'Hair', type: 'hair' },
  { name: 'Attire', type: 'attire' },
  { name: 'Scene', type: 'scene' },
  { name: 'Lighting', type: 'lighting' },
  { name: 'Camera', type: 'camera' },
  { name: 'Mood', type: 'mood' },
] as const

export const defaultAssets: Assets = {
  face: {
    type: 'face',
    url: 'https://rhxlulctluazrpqzooya.supabase.co/storage/v1/object/public/assets/face/ju.jpg',
  },
  makeup: {
    type: 'makeup',
    content: ''
  },
  hair: {
    type: 'hair',
    content: ''
  },
  attire: {
    type: 'attire',
    content: ''
  },
  scene: {
    type: 'scene',
    content: ''
  },
  lighting: {
    type: 'lighting',
    content: ''
  },
  camera: {
    type: 'camera',
    content: ''
  },
  mood: {
    type: 'mood',
    content: ''
  },
}

