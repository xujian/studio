'use client'

import { useRef, useState } from 'react'
import { AssetCard } from '@/components/asset-card'
import { AssetForm, AssetFormHandle } from '@/components/asset-form'
import { Sidepane } from '@/components/sidepane'
import { Button } from '@/components/button'
import type { Asset, AssetType, AssetWithPurchaseInfo } from '@/lib/types'
import { useAssets } from '@/hooks/use-assets'
import { ArrowLeft, Plus } from 'lucide-react'
import { AssetDetail } from './asset-detail'
import { PurchaseModal } from './purchase'
import { useBus } from '@/lib/bus'
import { usePromoteAsset } from '@/hooks/use-promote-asset'
import { useDeleteAsset, useRemovePurchase } from '@/hooks/use-delete-asset'

interface AssetsManagerProps {
  type: AssetType
  onClose: () => void
}

export function AssetsManager({ type, onClose }: AssetsManagerProps) {
  const $bus = useBus()
  const [formPaneOpen, setFormPaneOpen] = useState(false),
    [detailPaneOpen, setDetailPaneOpen] = useState(false),
    [buyModalOpen, setBuyModalOpen] = useState(false)

  const { data: assets = [] } = useAssets()
  const filtered = assets.filter(a => a.type === type && a.name !== '')
  const label = type.charAt(0).toUpperCase() + type.slice(1)
  const [activeItem, setActiveItem] = useState<Asset | undefined>(undefined)
  const promoteAsset = usePromoteAsset()
  const removePurchase = useRemovePurchase()
  const deleteAsset = useDeleteAsset()
  const form = useRef<AssetFormHandle>(null) 
  const onAssetFormClose = async () => {
    return await form.current!.allowDismiss()
  }
  const handleUse = (asset: AssetWithPurchaseInfo) => {
    $bus.emit('mixin:select', { type: asset.type, assetId: asset.id! })
  }
  const createItem = () => {
    setActiveItem(undefined)
    setFormPaneOpen(true)
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-12 rounded-full">
            <ArrowLeft className="size-10" strokeWidth={3} />
          </Button>
          <div>
            <h2 className="my-0 text-2xl leading-none font-semibold">
              {label}
            </h2>
            <p className="my-0 text-sm text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? 'asset' : 'assets'} of
              type {label} in your library
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
        {filtered.map(asset => (
          <AssetCard
            key={asset.id}
            data={asset}
            onEdit={(data) => {
              setActiveItem(data)
              setFormPaneOpen(true)
            }}
            onDetail={(data) => {
              setActiveItem(data)
              setDetailPaneOpen(true)
            }}
            onBuy={(data) => {
              setActiveItem(data)
              setBuyModalOpen(true)
            }}
          />
        ))}
        <div>
          <button
            onClick={createItem}
            className="flex flex-col items-center aspect-square w-full cursor-pointer justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground">
            <Plus className="size-6" />
            <span className="text-xs">Add an {label.toLowerCase()} asset</span>
          </button>
        </div>
      </div>
      <Sidepane open={formPaneOpen}
        onOpenChange={setFormPaneOpen}
        onBeforeClose={onAssetFormClose}
        title={activeItem ?
          `Edit ${activeItem.name}`
          : `Create a new ${label} Mixin`}>
        <AssetForm
          ref={form}
          type={type}
          asset={activeItem}
          onClose={() => setFormPaneOpen(false)} />
      </Sidepane>
      <Sidepane
        open={detailPaneOpen}
        onOpenChange={setDetailPaneOpen}
        className="sm:max-w-sm">
        { activeItem && (<AssetDetail
          asset={activeItem as AssetWithPurchaseInfo}
          isDeleting={false}
          onBuy={() => {
            setDetailPaneOpen(false)
            setBuyModalOpen(true)
          }}
          onUse={() => handleUse(activeItem as AssetWithPurchaseInfo)}
          onEdit={() => {
            setDetailPaneOpen(false)
            setFormPaneOpen(true)
          }}
          onPromote={() => {
            promoteAsset.mutate(activeItem!.id!)
            setDetailPaneOpen(false)
          }}
          onDelete={() => {
            if ((activeItem as AssetWithPurchaseInfo).is_purchased) {
              removePurchase.mutate(activeItem!.id!, {
                onSuccess: () => setDetailPaneOpen(false)
              })
            } else {
              deleteAsset.mutate(
                {
                  id: activeItem!.id!,
                  path: activeItem!.path
                },
                { onSuccess: () => setDetailPaneOpen(false) }
              )
            }
          }}
        />)}
      </Sidepane>
      {activeItem && (<PurchaseModal
        asset={activeItem as AssetWithPurchaseInfo}
        open={buyModalOpen}
        onOpenChange={setBuyModalOpen}
      />)}
    </div>
  )
}
