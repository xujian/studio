import { Asset, Assets, AssetType } from "./types"

export const assetTypes = [
  { name: 'Face', type: 'face' },
  { name: 'Makeup', type: 'makeup' },
  { name: 'Hair', type: 'hair' },
  { name: 'Outfit', type: 'outfit' },
  { name: 'Scene', type: 'scene' },
  { name: 'Lighting', type: 'lighting' },
  { name: 'Camera', type: 'camera' },
  { name: 'Mood', type: 'mood' },
] as const

export const defaultAssets: Assets = {
  face: {
    type: 'face',
    path: 'face/ju.jpg',
  },
  // makeup: {
  //   type: 'makeup',
  //   content: ''
  // },
  // hair: {
  //   type: 'hair',
  //   content: ''
  // },
  outfit: {
    type: 'outfit',
    content: 'casual shorts and a simple top'
  },
  // scene: {
  //   type: 'scene',
  //   content: ''
  // },
  // lighting: {
  //   type: 'lighting',
  //   content: ''
  // },
  // camera: {
  //   type: 'camera',
  //   content: ''
  // },
  // mood: {
  //   type: 'mood',
  //   content: ''
  // },
}

