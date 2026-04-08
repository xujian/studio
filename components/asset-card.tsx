'use client'

import { useState } from 'react'
import { AssetDetail } from '@/components/asset-detail'
import { AssetForm } from '@/components/asset-form'
import { AssetPreview } from '@/components/asset-preview'
import { Button } from '@/components/button'
import { CreditButton } from '@/components/credit-button'
import { Price } from '@/components/price'
import { PurchaseModal } from '@/components/purchase'
import { Sidepane } from '@/components/sidepane'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card'
import { useBus } from '@/lib/bus'
import type { Asset, AssetWithPurchaseInfo } from '@/lib/types'
import { useAssetStatus } from '@/hooks/use-asset-status'
import { useDeleteAsset, useRemovePurchase } from '@/hooks/use-delete-asset'
import { usePromoteAsset } from '@/hooks/use-promote-asset'
import { Check } from 'lucide-react'
import { ConfirmButton } from './confirm-button'

interface AssetCardProps {
  data: Asset
  hasPrice?: boolean,
  onEdit?: (data: AssetWithPurchaseInfo) => void,
  onDetail?: (data: AssetWithPurchaseInfo) => void,
  onBuy?: (data: AssetWithPurchaseInfo) => void
}

export function AssetCard({ data, hasPrice, onDetail, onEdit, onBuy }: AssetCardProps) {
  const $bus = useBus()
  const deleteAsset = useDeleteAsset()
  const removePurchase = useRemovePurchase()
  const promoteAsset = usePromoteAsset()
  const isDeleting = deleteAsset.isPending || removePurchase.isPending
  const {
    isPublic,
    isPurchased,
    isCustom,
    canUse,
    purchasable,
    deletable,
    canEdit,
    canPromote
  } = useAssetStatus(data as AssetWithPurchaseInfo)

  const handleUse = (asset: AssetWithPurchaseInfo) => {
    $bus.emit('mixin:select', { type: asset.type, assetId: asset.id! })
  }

  const handleDelete = (asset: AssetWithPurchaseInfo) => {
    if (asset.is_purchased) {
      removePurchase.mutate(asset.id!)
    } else {
      deleteAsset.mutate({ id: asset.id!, path: asset.path })
    }
  }

  return (
    <>
      <Card
        className="asset-card group cursor-pointer gap-0 border-0 bg-transparent p-0 transition-all"
        tabIndex={0}
        aria-label={`${data.title || data.name} asset`}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onDetail?.(data as AssetWithPurchaseInfo)
          }
        }}>
        <CardContent className="relative aspect-square w-full overflow-hidden rounded-3xl bg-neutral p-0">
          <AssetPreview
            asset={data}
            onClick={() => 
              onDetail?.(data as AssetWithPurchaseInfo)} />
          <div className="absolute top-2 right-2">
            {isPurchased
              ? (<Badge
                  variant="default"
                  className="gap-1 bg-positive text-xs text-positive-foreground">
                  <Check className="size-3" />
                  Bought
                </Badge>)
              : isCustom
                ? (<Badge variant="secondary" className="text-xs">
                    Custom
                  </Badge>)
                : hasPrice
                  ? data.price != null
                    ? (<Price value={data.price} />)
                    : null
                  : data.price != null
                    ? (<Badge>Store</Badge>)
                    : (<Badge>Public</Badge>)
            }
          </div>
          <div className="absolute bottom-0 left-0 flex w-full flex-row-reverse gap-1 p-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
            {purchasable && (
              <CreditButton
                cost={data.price ?? 0}
                size="xs"
                className="flex-1"
                onClick={e => {
                  e.stopPropagation()
                  onBuy?.(data as AssetWithPurchaseInfo)
                }}>
                BUY
              </CreditButton>
            )}
            {canUse && (
              <Button
                size="xs"
                className="flex-1"
                onClick={e => {
                  e.stopPropagation()
                  handleUse(data as AssetWithPurchaseInfo)
                }}>
                USE
              </Button>
            )}
            {canEdit && (
              <Button
                size="xs"
                variant="outline"
                onClick={e => {
                  e.stopPropagation()
                  onEdit?.(data as AssetWithPurchaseInfo)
                }}>
                EDIT
              </Button>
            )}
            {canPromote && (
              <ConfirmButton
                variant="outline"
                message="Confirm to put this asset to the Store?"
                action={e => {
                  e.stopPropagation()
                  promoteAsset.mutate(data.id!)
                }}>
                PROMOTE
              </ConfirmButton>
            )}
            {deletable && (
              <ConfirmButton
                message="Confirm to delete this Asset?"
                action={(e) => {
                  handleDelete(data as AssetWithPurchaseInfo)
                }}>
                DELETE
              </ConfirmButton>
            )}
          </div>
        </CardContent>
        <CardFooter className="px-0 py-2">
          <CardTitle>
            <h6>{data.title || data.name}</h6>
            <p className="caption">{data.name}</p>
          </CardTitle>
        </CardFooter>
      </Card>
    </>
  )
}
