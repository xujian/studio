'use client'

import Image from 'next/image'
import { Check, Coins } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui'
import { Peekable } from '@/components/peekable'
import { usePurchase } from '@/hooks/use-purchase'
import type { AssetWithPurchaseInfo } from '@/lib/types'
import { cn } from '@/lib/utils'

interface StoreCardProps {
  asset: AssetWithPurchaseInfo
}

export function StoreCard({ asset }: StoreCardProps) {
  const purchase = usePurchase()
  const isOwned = asset.is_purchased
  const hasImage = !!asset.url

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!asset.id || isOwned) return
    purchase.mutate(asset.id)
  }

  const card = (
    <div className={cn(
      'group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-all hover:elevation-2',
      isOwned && 'border-primary/30'
    )}>
      {/* Preview area */}
      <div className="relative aspect-[9/16] w-full overflow-hidden bg-black">
        {hasImage ? (
          <Image
            src={asset.url!}
            alt={asset.name || 'Asset'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3">
            <p className="line-clamp-6 text-xs text-neutral-400">
              {asset.content}
            </p>
          </div>
        )}

        {/* Owned badge */}
        {isOwned && (
          <div className="absolute top-2 right-2">
            <Badge variant="default" className="gap-1 bg-primary/90 text-xs">
              <Check className="size-3" />
              Owned
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 p-2">
        <p className="truncate text-sm font-medium">{asset.title || asset.name}</p>

        {/* Price / Buy */}
        {!isOwned && asset.price != null && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleBuy}
            disabled={purchase.isPending}
            className="mt-1 w-full gap-1 text-xs cursor-pointer"
          >
            <Coins className="size-3" />
            {purchase.isPending ? '...' : `${asset.price} credits`}
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <Peekable
      content={asset.url || asset.content || asset.name || ''}
      title={asset.title || asset.name}
      description={asset.description}
    >
      {card}
    </Peekable>
  )
}
