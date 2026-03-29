import { Asset, Assets, AssetType } from './types'

export const assetTypes = [
  { name: 'Face', type: 'face' },
  { name: 'Hair', type: 'hair' },
  { name: 'Makeup', type: 'makeup' },
  { name: 'Outfit', type: 'outfit' },
  { name: 'Scene', type: 'scene' },
  { name: 'Lighting', type: 'lighting' },
  { name: 'Camera', type: 'camera' },
  { name: 'Mood', type: 'mood' }
] as const

export const defaultAssets: Assets = {
  face: {
    type: 'face',
    path: 'face/ju.jpg'
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
  }
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
  {
    id: 'pack-1',
    label: 'Pack 1',
    credits: 50,
    price: 500
  },
  {
    id: 'pack-2',
    label: 'Pack 2',
    credits: 100,
    price: 1000
  },
  {
    id: 'pack-3',
    label: 'Pack 3',
    credits: 250,
    price: 2000
  },
  { id: 'pack-4',
    label: 'Pack 4',
    credits: 600,
    price: 5000
  }
] as const

export type CreditPackageId = (typeof CREDIT_PACKAGES)[number]['id']

// WARNING: SUBSCRIPTION_PLANS references server-only env vars (STRIPE_*_PRICE_ID).
// Only import this in Server Components, Route Handlers, or server actions — never in 'use client' files.
export const SUBSCRIPTION_PLANS = [
  {
    id: 'basic',
    label: 'Basic',
    price: 900, // cents
    credits: 100,
    stripePriceId: process.env.STRIPE_BASIC_PRICE_ID!,
    description: 'For casual creators'
  },
  {
    id: 'pro',
    label: 'Pro',
    price: 1900,
    credits: 250,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID!,
    description: 'For regular users',
    popular: true
  },
  {
    id: 'max',
    label: 'Max',
    price: 3900,
    credits: 600,
    stripePriceId: process.env.STRIPE_MAX_PRICE_ID!,
    description: 'For power users'
  }
] as const

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'max'
export type SubscriptionPlanId = (typeof SUBSCRIPTION_PLANS)[number]['id']
