'use client'

import { useState } from 'react'
import { useBus } from '@/lib/bus'
import { AssetCard } from "@/components/asset-card"
import { AssetDetail } from "@/components/asset-detail"
import { Sidepane } from "@/components/sidepane"
import { PurchaseModal } from '@/components/purchase'
import { Asset, AssetType, AssetWithPurchaseInfo } from "@/lib/types"

export type AssetGridProps = {
  data: {
    type: AssetType,
    name: string,
    assets: Asset[]
  }[]
}

export const AssetGrid = ({data: sections}: AssetGridProps) => {
  const $bus = useBus()
  const
    [detailPaneOpen, setDetailPaneOpen] = useState(false),
    [buyModalOpen, setBuyModalOpen] = useState(false)
  const [activeItem, setActiveItem] = useState<Asset | undefined>(undefined)
  const handleUse = (asset: AssetWithPurchaseInfo) => {
    $bus.emit('mixin:select', { type: asset.type, assetId: asset.id! })
  }

  return (
    <>
      <div className="flex flex-col gap-10">
        {sections.map(section => (
          <div key={section.type}>
            <h2 className="mb-3 leading-8 font-semibold">
              {section.name}
            </h2>
            <p className="caption mb-4">{section.assets.length} items total</p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {section.assets.map(asset => (
                <AssetCard
                  key={asset.id}
                  data={asset}
                  hasPrice
                  onDetail={(data) => {
                    setActiveItem(data)
                    setDetailPaneOpen(true)
                  }} 
                  onBuy={(data) => {
                    setActiveItem(data)
                    setBuyModalOpen(true)
                  }} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <Sidepane
        open={detailPaneOpen}
        onOpenChange={setDetailPaneOpen}
        className="sm:max-w-sm">
        {activeItem && (
          <AssetDetail
            asset={activeItem as AssetWithPurchaseInfo}
            isDeleting={false}
            hasPrice
            onBuy={() => {
              setDetailPaneOpen(false)
              setBuyModalOpen(true)
            }}
            onUse={() => handleUse(activeItem as AssetWithPurchaseInfo)}
          />
        )}
      </Sidepane>
      {activeItem && (
        <PurchaseModal
          asset={activeItem as AssetWithPurchaseInfo}
          open={buyModalOpen}
          onOpenChange={setBuyModalOpen}
        />
      )}
    </>
  )
}