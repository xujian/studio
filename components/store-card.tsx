'use client'

import Image from 'next/image'
import { Peekable } from '@/components/peekable'
import { Button } from '@/components/ui'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { AssetWithPurchaseInfo } from '@/lib/types'
import { assetUrl, cn } from '@/lib/utils'
import { usePurchase } from '@/hooks/use-purchase'
import { Check, Coins } from 'lucide-react'

interface StoreCardProps {
  asset: AssetWithPurchaseInfo
}

export function StoreCard({ asset }: StoreCardProps) {
  const purchase = usePurchase()
  const isOwned = asset.is_purchased
  const hasImage = !!asset.path

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!asset.id || isOwned) return
    purchase.mutate(asset.id)
  }

  const card = (
    <Card className={cn(
      'group hover:elevation-2 gap-0 overflow-hidden p-0 transition-all',
      isOwned && 'border-primary/30'
    )}>
      {/* Preview with price tag overlay */}
      <CardContent className="relative aspect-square w-full overflow-hidden bg-black p-0">
        {hasImage ? (
          <Image
            src={assetUrl(asset.path!)}
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

        {/* Top-right corner tag */}
        <div className="absolute top-2 right-2">
          {isOwned ? (
            <Badge variant="default" className="gap-1 bg-primary/90 text-xs">
              <Check className="size-3" />
              Owned
            </Badge>
          ) : asset.price != null ? (
            <Badge
              variant="secondary"
              className="cursor-pointer gap-1 text-xs"
              onClick={handleBuy}>
              {purchase.isPending
                ? '...' 
                : `${asset.price} CREDIT`
              }
            </Badge>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="p-2">
        <CardTitle className="truncate text-sm">
          {asset.title || asset.name}
        </CardTitle>
      </CardFooter>
    </Card>
  )

  return (
    <Peekable
      size="xl"
      content={asset.path
        ? assetUrl(asset.path)
        : asset.content || asset.name || ''}
      title={asset.title || asset.name}
      description={asset.description}>
      {card}
    </Peekable>
  )
}
