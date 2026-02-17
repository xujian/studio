import type { User as SupabaseUser } from '@supabase/supabase-js'
import { CamelCasedProperties } from 'type-fest'
import { assetTypes } from './constants'

export const assetTypeNames = assetTypes.map(t => t.type)

/**
 * type of asset
 */
export type AssetType = typeof assetTypeNames[number]

export type AssetValue = {
  [k in AssetType]?: string
}

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
  title?: string
  reference?: string,
  mixins?: Mixins
  final_prompt?: string
  status?: 'pending' | 'processing' | 'completed' | 'failed'
  created_at?: string
}

export type Photo = {
  id: string
  moment_id: string
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
  created_at: string
}

export type MomentWithPhotos = Moment & {
  photos: Photo[]
}

/**
 * Reueable resource to build prompts
 */
export type Asset = {
  id?: string
  user_id?: string // NULL = official Kanojo Studio asset
  name?: string
  title?: string
  description?: string
  type: AssetType // face, reference, outfit, scene, etc.
  path?: string | null // if image-based asset
  content?: string | null // if text-based asset
  is_public?: boolean
  price?: number | null // credits cost (NULL = personal asset, not for sale)
  created_at?: string
}

export type Assets = {
  [k in AssetType]?: Asset
}

export type AssetMap = Map<string, Asset>

export type Mixins = {
  [k in AssetType]?: string
}

/**
 * Community post with moment, author, and like info
 */
export type Post = {
  id: string
  user_id: string
  moment_id: string
  created_at: string
  moment: MomentWithPhotos
  author: { id: string; name: string | null; avatar: string | null }
  likes_count: number
  liked: boolean
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

export type AssetWithPurchaseInfo = Asset & {
  is_purchased: boolean
}

export type JsonPrompt = Partial<Record<AssetType, string | Record<string, string>>>

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'