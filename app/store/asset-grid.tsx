'use client'

import { useState } from 'react'
import { useBus } from '@/lib/bus'
import { AssetCard } from "@/components/asset-card"
import { AssetDetail } from "@/components/asset-detail"
import { Sidepane } from "@/components/sidepane"
import { PurchaseModal } from '@/components/purchase'
import { Sorting, SortOption } from '@/components/sorting'
import { Asset, AssetType, AssetWithPurchaseInfo } from "@/lib/types"

type SortKey = 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'name'

const sortOptions: SortOption<SortKey>[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name (A–Z)' },
]

const sorters: Record<SortKey, (a: Asset, b: Asset) => number> = {
  newest: (a, b) => (b.created ?? '').localeCompare(a.created ?? ''),
  oldest: (a, b) => (a.created ?? '').localeCompare(b.created ?? ''),
  'price-asc': (a, b) => (a.price ?? 0) - (b.price ?? 0),
  'price-desc': (a, b) => (b.price ?? 0) - (a.price ?? 0),
  name: (a, b) =>
    (a.title ?? a.name ?? '').localeCompare(b.title ?? b.name ?? ''),
}

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
  const [sortBy, setSortBy] = useState<Record<string, SortKey>>({})
  const handleUse = (asset: AssetWithPurchaseInfo) => {
    $bus.emit('mixin:select', { type: asset.type, assetId: asset.id! })
  }

  return (
    <>
      <div className="flex flex-col gap-10">
        {sections.map(section => {
          const sortKey = sortBy[section.type] ?? 'newest'
          const sortedAssets = [...section.assets].sort(sorters[sortKey])
          return (
          <div className="asset-section mb-80" key={section.type}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="mb-3 leading-8 font-semibold">
                  {section.name}
                </h2>
                <p className="caption">{section.assets.length} items total</p>
              </div>
              <Sorting
                options={sortOptions}
                value={sortKey}
                onChange={value =>
                  setSortBy(prev => ({ ...prev, [section.type]: value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {sortedAssets.map(asset => (
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
          )
        })}
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