'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardFooter,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/button'
import type { Asset, AssetWithPurchaseInfo } from '@/lib/types'
import { assetUrl, cn } from '@/lib/utils'
import { Check, Trash2 } from 'lucide-react'
import { Price } from '@/components/price'
import { PurchaseModal } from '@/components/purchase'

interface AssetCardProps {
  data: Asset
  // Hover overlay actions
  onUse?: () => void
  onDelete?: () => void
  // Override click (when omitted, falls back to internal PurchaseModal if purchasable)
  onClick?: () => void
  // Badge override (when omitted, derives from is_purchased / price)
  badge?: React.ReactNode
}

export function AssetCard({ data, onUse, onDelete, onClick, badge }: AssetCardProps) {
  const [open, setOpen] = useState(false)

  const purchasable = 'is_purchased' in data
  const isOwned = purchasable ? (data as AssetWithPurchaseInfo).is_purchased : false
  const hasImage = !!data.path
  const hasOverlay = onUse || onDelete

  const handleClick = onClick ?? (purchasable ? () => setOpen(true) : undefined)

  const derivedBadge = purchasable
    ? isOwned
      ? (
        <Badge variant="default" className="gap-1 bg-primary/90 text-xs">
          <Check className="size-3" />
          Owned
        </Badge>
      )
      : data.price != null
        ? <Price value={data.price} />
        : null
    : null

  return (
    <>
      <Card
        className={cn(
          'group gap-0 overflow-hidden p-0 transition-all',
          handleClick && 'cursor-pointer hover:elevation-2',
          isOwned && 'border-primary/30'
        )}
        onClick={handleClick}
      >
        <CardContent className="relative aspect-square w-full overflow-hidden bg-black p-0">
          {hasImage ? (
            <Image
              src={assetUrl(data.path!)}
              alt={data.name || 'Asset'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-3">
              <p className="line-clamp-6 text-xs text-neutral-400">
                {data.content}
              </p>
            </div>
          )}

          <div className="absolute top-2 right-2">
            {badge ?? derivedBadge}
          </div>

          {hasOverlay && (
            <div className={cn(
              'absolute inset-0 flex flex-col items-center justify-center gap-1.5',
              'bg-black/60 opacity-0 transition-opacity group-hover:opacity-100'
            )}>
              {onUse && (
                <Button
                  size="sm"
                  className="h-7 gap-1 rounded-full px-3 text-xs"
                  onClick={e => { e.stopPropagation(); onUse() }}>
                  <Check className="size-3" />
                  Use
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 gap-1 rounded-full px-3 text-xs"
                  onClick={e => { e.stopPropagation(); onDelete() }}>
                  <Trash2 className="size-3" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="p-2">
          <CardTitle className="truncate text-sm">
            {data.title || data.name}
          </CardTitle>
        </CardFooter>
      </Card>

      {purchasable && (
        <PurchaseModal asset={data as AssetWithPurchaseInfo} open={open} onOpenChange={setOpen} />
      )}
    </>
  )
}
