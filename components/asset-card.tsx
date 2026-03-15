'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/button'
import type { Asset, AssetWithPurchaseInfo } from '@/lib/types'
import { assetUrl, assetStatus } from '@/lib/utils'
import { Check } from 'lucide-react'
import { Price } from '@/components/price'
import { PurchaseModal } from '@/components/purchase'
import { useBus } from '@/lib/bus'
import { useDeleteAsset, useRemovePurchase } from '@/hooks/use-delete-asset'
import { AssetDetailSheet } from '@/components/asset-detail-sheet'

interface AssetCardProps {
  data: Asset
  hasPrice?: boolean
}

export function AssetCard({ data, hasPrice }: AssetCardProps) {
  const $bus = useBus()
  const deleteAsset = useDeleteAsset()
  const removePurchase = useRemovePurchase()
  const [modalOpen, setModalOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const isDeleting = deleteAsset.isPending || removePurchase.isPending
  const { isPublic, isPurchased, isCustom, canUse, purchasable, deletable } = assetStatus(data as AssetWithPurchaseInfo)
  const handleBuy = () => setModalOpen(true)

  const handleUse = (asset: AssetWithPurchaseInfo) => {
    $bus.emit('mixin:select', { type: asset.type, assetId: asset.id! })
  }

  const handleDelete = (asset: AssetWithPurchaseInfo) => {
    console.log('Deleting asset:', asset)
    if (asset.is_purchased) {
      removePurchase.mutate(asset.id!)
    } else {
      deleteAsset.mutate({ id: asset.id!, path: asset.path })
    }
  }

  return (
    <>
      <Card className="asset-card group gap-0 p-0 transition-all cursor-pointer border-0" onClick={() => setSheetOpen(true)}>
        <CardContent className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted p-0">
          {data.path
            ? (<Image
                src={assetUrl(data.path)}
                alt={data.name || 'Asset'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />)
            : (<div className="asset-content flex h-full items-center justify-center p-3">
                <p className="line-clamp-6 text-xs text-neutral-400">{data.content}</p>
              </div>)
          }
          <div className="absolute top-2 right-2">
            {isPurchased
              ? (<Badge variant="default" className="gap-1 bg-primary/90 text-xs">
                  <Check className="size-3" />
                  Bought
                </Badge>)
              : isCustom
                ? (<Badge variant="secondary" className="text-xs">
                    Custom
                  </Badge>)
                : hasPrice && data.price != null
                  ? (<Price value={data.price} />)
                  : null
            }
          </div>
          <div className="absolute left-0 bottom-0 w-full flex flex-row-reverse gap-1 p-1 opacity-0 transition-opacity group-hover:opacity-100">
            {purchasable && (
              <Button size="sm" className="h-7 bg-black text-white flex-1 rounded-full text-xs" onClick={(e) => { e.stopPropagation(); handleBuy() }}>
                BUY
              </Button>
            )}
            {canUse  && (
              <Button size="sm"
                className="h-7 bg-black text-white gap-1 flex-1 rounded-full text-xs"
                onClick={(e) => { e.stopPropagation(); handleUse(data as AssetWithPurchaseInfo) }}>
                USE
              </Button>
            )}
            {deletable && (
              <Button size="sm"
                variant="destructive"
                className="h-7 bg-destructive text-white flex-0 w-20 gap-1 rounded-full text-xs"
                onClick={(e) => { e.stopPropagation(); handleDelete(data as AssetWithPurchaseInfo) }}>
                DELETE
              </Button>
            )}
          </div>
        </CardContent>
        <CardFooter className="py-2 px-0">
          <CardTitle>
            <h6>{data.title || data.name}</h6>
            <p className="caption">{data.name}</p>
          </CardTitle>
        </CardFooter>
      </Card>

      <PurchaseModal asset={data as AssetWithPurchaseInfo} open={modalOpen} onOpenChange={setModalOpen} />
      <AssetDetailSheet
        asset={data as AssetWithPurchaseInfo}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        hasPrice={hasPrice}
        isDeleting={isDeleting}
        onBuy={() => { setSheetOpen(false); setModalOpen(true) }}
        onUse={() => handleUse(data as AssetWithPurchaseInfo)}
        onDelete={() => {
          if ((data as AssetWithPurchaseInfo).is_purchased) {
            removePurchase.mutate(data.id!, { onSuccess: () => setSheetOpen(false) })
          } else {
            deleteAsset.mutate({ id: data.id!, path: data.path }, { onSuccess: () => setSheetOpen(false) })
          }
        }}
      />
    </>
  )
}
