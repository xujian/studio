'use client'

import { useProfile } from '@/hooks/use-profile'
import type { AssetWithPurchaseInfo } from '@/lib/types'

export const useAssetStatus = (asset: AssetWithPurchaseInfo) => {
  const { data: profile } = useProfile()
  const isSuper = profile?.super ?? false
  const isPublic = asset.user_id == null
  const isPurchased = !!asset.is_purchased
  const isCustom = !isPublic && !isPurchased
  return {
    isPublic,
    isPurchased,
    isCustom,
    canUse: (isPublic && asset.price == null) || isPurchased || isCustom,
    purchasable: isPublic && asset.price != null && !isPurchased,
    deletable: isPurchased || isCustom || isSuper,
    canEdit: isCustom || isSuper,
    canPromote: isSuper && isCustom,
  }
}
