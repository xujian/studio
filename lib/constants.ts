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

export const CREDIT_PACKAGES = [
  { id: 'starter', label: 'Starter', credits: 100,  price: 500  },
  { id: 'popular', label: 'Popular', credits: 500,  price: 2000 },
  { id: 'pro',     label: 'Pro',     credits: 1500, price: 5000 },
] as const

export type CreditPackageId = typeof CREDIT_PACKAGES[number]['id']

export const SUBSCRIPTION_PLANS = [
  {
    id: 'basic' as const,
    label: 'Basic',
    price: 900,         // cents
    credits: 100,
    stripePriceId: process.env.STRIPE_BASIC_PRICE_ID!,
    description: 'For casual creators',
  },
  {
    id: 'creator' as const,
    label: 'Creator',
    price: 1900,
    credits: 300,
    stripePriceId: process.env.STRIPE_CREATOR_PRICE_ID!,
    description: 'For regular users',
    popular: true,
  },
  {
    id: 'pro' as const,
    label: 'Pro',
    price: 3900,
    credits: 800,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID!,
    description: 'For power users',
  },
] as const

export type SubscriptionTier = 'free' | 'basic' | 'creator' | 'pro'
export type SubscriptionPlanId = typeof SUBSCRIPTION_PLANS[number]['id']
