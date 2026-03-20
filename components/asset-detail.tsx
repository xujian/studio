'use client'

import { Price } from '@/components/price'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { AssetWithPurchaseInfo } from '@/lib/types'
import { assetStatus } from '@/lib/utils'
import { AssetPreview } from '@/components/asset-preview'
import { Check, Loader2 } from 'lucide-react'

type AssetDetailProps = {
  asset: AssetWithPurchaseInfo
  hasPrice?: boolean
  isDeleting?: boolean
  onBuy: () => void
  onUse: () => void
  onDelete: () => void
}

export const AssetDetail = ({
  asset,
  hasPrice,
  isDeleting,
  onBuy,
  onUse,
  onDelete
}: AssetDetailProps) => {
  const { isPurchased, isCustom, canUse, purchasable, deletable } = assetStatus(asset)

  return (
    <div className="flex flex-col h-full">
      {/* Hero */}
      <div className="relative aspect-square w-full overflow-hidden">
        <AssetPreview asset={asset} />
        {/* Badges overlay */}
        <div className="absolute right-3 bottom-3 left-3 flex items-end justify-between">
          <Badge className="border-white/20 bg-white/10 text-[10px] tracking-widest text-white uppercase backdrop-blur-sm">
            {asset.type}
          </Badge>
          {isPurchased ? (
            <Badge className="gap-1 bg-primary/90 text-xs">
              <Check className="size-3" />
              Bought
            </Badge>
          ) : isCustom ? (
            <Badge variant="secondary" className="text-xs">
              Custom
            </Badge>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col flex-1 gap-1 p-4">
        <h2 className="text-base leading-tight font-semibold">
          {asset.title || asset.name}
        </h2>
        {asset.name && asset.title && (
          <p className="text-xs text-muted-foreground">{asset.name}</p>
        )}
        {asset.description && (
          <p className="text-sm leading-snug text-muted-foreground">
            {asset.description}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1 p-2">
        {hasPrice && asset.price != null && (
          <Price value={asset.price} variant="button" />
        )}
        {canUse && (
          <Button className="button w-full" onClick={onUse}>
            Use
          </Button>
        )}
        {hasPrice && purchasable && (
          <Button className="button w-full" onClick={onBuy}>
            Buy
          </Button>
        )}
        {deletable && (
          <Button
            variant="destructive"
            className="button w-full"
            disabled={isDeleting}
            onClick={onDelete}>
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : 'Delete'}
          </Button>
        )}
      </div>
    </div>
  )
}
