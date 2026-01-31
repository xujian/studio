import type { User as SupabaseUser } from '@supabase/supabase-js'
import { CamelCasedProperties } from 'type-fest'
import { assetTypes } from './constants'

export const assetTypeNames = assetTypes.map(t => t.type)

/**
 * type of asset
 */
export type AssetType = typeof assetTypeNames[number]

/**
 * seperate type for supabase user
 */
export type User = CamelCasedProperties<SupabaseUser>

export type Profile = {
  id: string
  name: string | null
  avatar: string | null
  credits: number
  created_at: string
}

export type Moment = {
  id: string
  user_id: string
  prompt: string
  final_prompt: string | null
  seed: number | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
}

export type Photo = {
  id: string
  moment_id: string
  url: string
  created_at: string
}

export type MomentWithPhotos = Moment & {
  photos: Photo[]
}

/**
 * Reueable resource to build prompts
 */
export type Asset = {
  id: string
  user_id: string | null // NULL = official Kanojo Studio asset
  name: string
  description: string | null
  type: AssetType // face, reference, attire, scene, etc.
  url: string | null // if image-based asset
  content: string | null // if text-based asset
  is_public: boolean
  price: number | null // credits cost (NULL = personal asset, not for sale)
  created_at: string
}

/**
 * Asset applied to a moment or ad-hoc custom asset
 */
export type Mixin = {
  id: string
  moment_id: string
  asset_id: string | null // references asset if from library
  type: AssetType // when asset_id is null, defines type of custom asset
  content: string | null // snapshot of asset content at time of application
  url: string | null // snapshot of asset url at time of application
  created_at: string
}

/**
 * Moments shared by users
 */
export type Post = {
  id: string
  user_id: string
  moment_id: string
  created_at: string
}

/**
 * Likes on posts
 */
export type Like = {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

/**
 * Purchases of assets by users
 */
export type Purchase = {
  id: string
  buyer_id: string
  asset_id: string
  price: number // credits spent at time of purchase
  created_at: string
}

export type Transaction = {
  id: string
  user_id: string
  type: 'asset_purchase' | 'generation_cost' | 'credit_purchase' | 'refund'
  amount: number // negative = debit, positive = credit
  related_id: string | null // purchase_id, moment_id, etc.
  description: string | null
  created_at: string
}

// Extended types with relations
export type PostWithMoment = Post & {
  moment: MomentWithPhotos
}

export type PostWithLikes = Post & {
  likes: Like[]
  likes_count: number
}

export type AssetWithPurchaseInfo = Asset & {
  is_purchased: boolean
}
