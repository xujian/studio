'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreditButton } from '@/components/credit-button'
import type { AssetWithPurchaseInfo } from '@/lib/types'
import { useAssetStatus } from '@/hooks/use-asset-status'
import { AssetPreview } from '@/components/asset-preview'
import { Check, Loader2 } from 'lucide-react'

type AssetDetailProps = {
  asset: AssetWithPurchaseInfo
  hasPrice?: boolean
  isDeleting?: boolean
  onBuy: () => void
  onUse: () => void
  onDelete?: () => void
  onEdit?: () => void
  onPromote?: () => void
}

export const AssetDetail = ({
  asset,
  hasPrice,
  isDeleting,
  onBuy,
  onUse,
  onDelete,
  onEdit,
  onPromote,
}: AssetDetailProps) => {
  const { isPurchased, isCustom, canUse, purchasable, deletable, canEdit, canPromote } = useAssetStatus(asset)

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
            <Badge className="gap-1 bg-positive text-positive-foreground text-xs">
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
        <h2 className="text-base my-0 font-semibold">
          {asset.title || asset.name}
        </h2>
        {asset.name && asset.title && (
          <Badge className="bg-background text-xs text-background-foreground">
            {asset.name}
          </Badge>
        )}
        <p>&nbsp;</p>
        <h6>Content</h6>
        <div className="bg-muted p-2 rounded-2xl text-xs leading-tight text-muted-foreground">
          {asset.content || '(EMPTY)'}
        </div>
        {asset.description && (
          <p className="text-sm leading-snug text-muted-foreground">
            {asset.description}
          </p>
        )}
      </div>
      <div className="flex-1 p-2 flex flex-col gap-1 justify-end">
        <div className="flex items-center gap-1">
          {deletable && (
            <Button
              variant="destructive"
              size="sm"
              className="button"
              disabled={isDeleting}
              onClick={onDelete}>
              {isDeleting ? <Loader2 className="size-4 animate-spin" /> : 'Delete'}
            </Button>
          )}
          {canEdit && onEdit && (
            <Button variant="outline" size="sm" className="button" onClick={onEdit}>
              Edit
            </Button>
          )}
          {canPromote && onPromote && (
            <Button variant="outline" size="sm" className="button" onClick={onPromote}>
              Promote
            </Button>
          )}
          {canUse && (
            <Button className="button flex-1" size="sm" onClick={onUse}>
              Use
            </Button>
          )}
          {hasPrice && purchasable && (
            <CreditButton cost={asset.price ?? 0} className="button flex-1" size="sm" onClick={onBuy}>
              Buy
            </CreditButton>
          )}
        </div>
      </div>
    </div>
  )
}
