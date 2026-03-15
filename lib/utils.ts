import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { AssetWithPurchaseInfo } from '@/lib/types'

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}

/**
 * Derive photo public URL from IDs.
 * Storage path: {userId}/{momentId}/{photoId}.jpg in the `photos` bucket.
 */
export const photoUrl = (userId: string, momentId: string, photoId: string) =>
  [
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}`,
    '/storage/v1/object/public/photos/',
    `${userId}/${momentId}/${photoId}.jpg`
  ].join('')

export const uploadUrl = (userId: string, filename: string) =>
  [
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}`,
    '/storage/v1/object/public/uploads/',
    `${userId}/${filename}`
  ].join('')

export const assetUrl = (path: string) =>
  [
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}`,
    '/storage/v1/object/public/assets/',
    `${path}`
  ].join('')

export const storageUrl = (path: string) =>
  [
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}`,
    '/storage/v1/object/public/',
    `${path}`
  ].join('')

/**
 * Derive display/action flags for an asset card or sheet.
 * isPublic  = official Kanojo Studio asset (user_id IS NULL)
 * isCustom  = user's own personal asset
 * canUse    = asset is usable without purchase (free official, purchased, or custom)
 * purchasable = official asset with a price that hasn't been bought yet
 * deletable = purchased or custom (not a free official asset)
 */
export const assetStatus = (asset: AssetWithPurchaseInfo) => {
  const isPublic = asset.user_id == null
  const isPurchased = !!asset.is_purchased
  const isCustom = !isPublic && !isPurchased
  return {
    isPublic,
    isPurchased,
    isCustom,
    canUse: (isPublic && asset.price == null) || isPurchased || isCustom,
    purchasable: isPublic && asset.price != null && !isPurchased,
    deletable: isPurchased || isCustom,
  }
}