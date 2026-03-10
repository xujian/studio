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
import type { AssetWithPurchaseInfo } from '@/lib/types'
import { assetUrl, cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { Price } from '@/components/price'
import { PurchaseModal } from '@/components/purchase'

interface AssetCardProps {
  data: AssetWithPurchaseInfo
}

export function AssetCard({ data }: AssetCardProps) {
  const [open, setOpen] = useState(false)
  const isOwned = data.is_purchased
  const hasImage = !!data.path

  return (
    <>
      <Card
        className={cn(
          'group cursor-pointer hover:elevation-2 gap-0 overflow-hidden p-0 transition-all',
          isOwned && 'border-primary/30'
        )}
        onClick={() => setOpen(true)}
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

          {/* Top-right corner tag */}
          <div className="absolute top-2 right-2">
            {isOwned ? (
              <Badge variant="default" className="gap-1 bg-primary/90 text-xs">
                <Check className="size-3" />
                Owned
              </Badge>
            ) : data.price != null ? (
              <Price value={data.price} />
            ) : null}
          </div>
        </CardContent>

        <CardFooter className="p-2">
          <CardTitle className="truncate text-sm">
            {data.title || data.name}
          </CardTitle>
        </CardFooter>
      </Card>

      <PurchaseModal asset={data} open={open} onOpenChange={setOpen} />
    </>
  )
}
