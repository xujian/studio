'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/button'
import type { Asset, AssetWithPurchaseInfo } from '@/lib/types'
import { assetUrl, cn } from '@/lib/utils'
import { Check, ShoppingCart, Trash2 } from 'lucide-react'
import { Price } from '@/components/price'
import { PurchaseModal } from '@/components/purchase'

interface AssetCardProps {
  data: Asset
  owned?: boolean
  hasPrice?: boolean
  /** Override BUY click — falls back to internal PurchaseModal when omitted */
  onBuy?: () => void
  onUse?: () => void
  onDelete?: () => void
}

export function AssetCard({ data, owned, hasPrice, onBuy, onUse, onDelete }: AssetCardProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const isPurchasable = 'is_purchased' in data
  const handleBuy = onBuy ?? (() => setModalOpen(true))

  return (
    <>
      <Card className={cn(
        'group gap-0 overflow-hidden p-0 transition-all',
        owned && 'border-primary/30'
      )}>
        <CardContent className="relative aspect-square w-full overflow-hidden bg-black p-0">
          {data.path ? (
            <Image
              src={assetUrl(data.path)}
              alt={data.name || 'Asset'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-3">
              <p className="line-clamp-6 text-xs text-neutral-400">{data.content}</p>
            </div>
          )}

          {/* Badge */}
          <div className="absolute top-2 right-2">
            {owned ? (
              <Badge variant="default" className="gap-1 bg-primary/90 text-xs">
                <Check className="size-3" />
                Owned
              </Badge>
            ) : hasPrice && data.price != null ? (
              <Price value={data.price} />
            ) : null}
          </div>

          {/* Overlay — always on hover, buttons at bottom */}
          <div className="absolute inset-0 flex flex-col justify-end gap-1.5 bg-linear-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
            {!owned && hasPrice && (
              <Button size="sm" className="h-7 w-full gap-1 rounded-full text-xs" onClick={handleBuy}>
                <ShoppingCart className="size-3" />
                Buy
              </Button>
            )}
            {owned && onUse && (
              <Button size="sm" className="h-7 w-full gap-1 rounded-full text-xs" onClick={onUse}>
                <Check className="size-3" />
                Use
              </Button>
            )}
            {owned && onDelete && (
              <Button size="sm" variant="destructive" className="h-7 w-full gap-1 rounded-full text-xs" onClick={onDelete}>
                <Trash2 className="size-3" />
                Delete
              </Button>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-2">
          <CardTitle className="truncate text-sm">
            {data.title || data.name}
          </CardTitle>
        </CardFooter>
      </Card>

      {isPurchasable && (
        <PurchaseModal asset={data as AssetWithPurchaseInfo} open={modalOpen} onOpenChange={setModalOpen} />
      )}
    </>
  )
}
