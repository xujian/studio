import type { User as SupabaseUser } from '@supabase/supabase-js'
import { CamelCasedProperties } from 'type-fest'
import { assets } from './assets-config'
import type { SubscriptionTier } from './constants'

export const assetTypeNames = assets.map(t => t.id)

/**
 * type of asset
 */
export type AssetType = 'face' | 'makeup' | 'hair' | 'outfit' | 'scene' | 'lighting' | 'camera' | 'mood'

export type AssetValue = {
  [k in AssetType]?: string
}

/**
 * seperate type for supabase user
 */
export type User = CamelCasedProperties<SupabaseUser>

export type Profile = {
  id: string
  name: string
  avatar: string
  credits: number
  customer: string | null        // was: stripe_customer_id
  tier: SubscriptionTier         // was: subscription_tier
  super: boolean
  created: string                // was: created_at
}

export type Moment = {
  id: string
  user: string                   // was: user_id
  prompt: string
  title?: string
  reference?: string,
  mixins?: Mixins
  final?: string                 // was: final_prompt
  status?: 'pending' | 'processing' | 'completed' | 'failed'
  created?: string               // was: created_at
}

export type Photo = {
  id: string
  moment: string                 // was: moment_id
  user: string                   // was: user_id
  /**
   * Only set if different from moment's prompt.
   * Display logic: photo.prompt || moment.prompt
   */
  prompt: string | null
  /**
   * Only contains keys that differ from moment's mixins.
   * Display logic: { ...moment.mixins, ...photo.mixins }
   * Example: { face: "uuid-of-face-asset" }
   */
  mixins: Mixins | null
  created: string                // was: created_at
}

export type MomentWithPhotos = Moment & {
  photos: Photo[]
  published?: boolean
}

/**
 * Reueable resource to build prompts
 */
export type Asset = {
  id?: string
  user?: string                  // was: user_id — NULL = official Kanojo Studio asset
  name?: string
  title?: string
  description?: string
  type: AssetType                // face, reference, outfit, scene, etc.
  path?: string | null           // if image-based asset
  content?: string | null        // if text-based asset
  price?: number | null          // credits cost (NULL = personal asset, not for sale)
  created?: string               // was: created_at
}

export type AssetPreviewSettings = {
  aperture: number,
  focal: number,
  /**
   * from the camera to the subject
   */
  distance?: number,  // meters from camera to subject; closer = shallower DoF
  translate?: string,
  /**
   * Depth of the view
   */
  depth?: number,
  rotate?: {
    x: string,
    y: string,
    z: string,
  },
  /**
   * demonstrating angle of the view
   */
  perspective?: string, 
}

export type AdhocAsset = Asset & {
  name: ''
}

export type Assets = {
  [k in AssetType]?: Asset
}

export type AssetMap = Map<string, Asset>

export type MixinsWithAdhoc = {
  [k in AssetType]?: string | AdhocAsset
}

export type Mixins = {
  [k in AssetType]?: string
}

/**
 * Community post with moment, author, and like info
 */
export type Post = {
  id: string
  user: string                   // was: user_id
  created: string                // was: created_at
  moment: MomentWithPhotos
  author: { id: string; name: string | null; avatar: string | null }
  likes: number                  // was: likes_count
  liked: boolean
}

/**
 * Likes on posts
 */
export type Like = {
  id: string
  post: string                   // was: post_id
  user: string                   // was: user_id
  created: string                // was: created_at
}

/**
 * Purchases of assets by users
 */
export type Purchase = {
  id: string
  buyer: string                  // was: buyer_id
  asset: string                  // was: asset_id
  price: number                  // credits spent at time of purchase
  created: string                // was: created_at
}

export type Transaction = {
  id: string
  user: string                   // was: user_id
  type: 'asset_purchase' | 'generation_cost' | 'credit_purchase' | 'refund' | 'subscription_reset'
  amount: number                 // negative = debit, positive = credit
  ref: string | null             // was: related_id — purchase_id, moment_id, etc.
  description: string | null
  created: string                // was: created_at
}

export type Subscription = {
  id: string
  user: string                   // was: user_id
  subscription: string           // was: stripe_subscription_id
  customer: string               // was: stripe_customer_id
  tier: SubscriptionTier
  status: 'active' | 'past_due' | 'canceled'
  end: string                    // was: current_period_end
  created: string                // was: created_at
  updated: string                // was: updated_at
}

export type AssetWorkMode =
  'text-first'
  | 'image-only'
  | 'text-only'

export type AssetRunMode = 'text' | 'image'

export type AssetWithPurchaseInfo = Asset & {
  purchased: boolean             // was: is_purchased
  owners: number                 // count of purchases rows for this asset
}

export type JsonPrompt = Partial<Record<AssetType, string | Record<string, string>>>

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
