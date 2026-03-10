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
        'group gap-0 overflow-hidden p-0 transition-all cursor-pointer rounded-xl',
        owned && 'border-primary/30'
      )}>
        <CardContent className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted p-0">
          {data.path
            ? (<Image
                src={assetUrl(data.path)}
                alt={data.name || 'Asset'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />)
            : (<div className="flex h-full items-center justify-center p-3">
                <p className="line-clamp-6 text-xs text-neutral-400">{data.content}</p>
              </div>)
          }
          <div className="absolute top-2 right-2">
            {owned
            ? (<Badge variant="default" className="gap-1 bg-primary/90 text-xs">
                <Check className="size-3" />
                Owned
              </Badge>)
            : hasPrice && data.price != null
              ? (<Price value={data.price} />)
              : null
            }
          </div>
          <div className="absolute left-0 bottom-0 w-full flex flex-row-reverse gap-1 p-1 opacity-0 transition-opacity group-hover:opacity-100">
            {!owned && hasPrice && (
              <Button size="sm" className="h-7 bg-black text-white flex-1 rounded-full text-xs" onClick={handleBuy}>
                BUY
              </Button>
            )}
            {owned && (
              <Button size="sm" className="h-7 bg-black text-white gap-1 flex-1 rounded-full text-xs" onClick={onUse}>
                USE
              </Button>
            )}
            {owned && (
              <Button size="sm" variant="destructive" className="h-7 bg-destructive text-white flex-0 w-20 gap-1 rounded-full text-xs" onClick={onDelete}>
                DELETE
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
