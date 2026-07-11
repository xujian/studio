import type { SortOption } from '@/components/sorting'
import type { Asset, AssetWithPurchaseInfo } from '@/lib/types'

export type AssetSortKey = 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'name' | 'popular'

export const assetSortOptions: SortOption<AssetSortKey>[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'popular', label: 'Most Purchased' },
]

export const assetSorters: Record<AssetSortKey, (a: Asset, b: Asset) => number> = {
  newest: (a, b) => (b.created ?? '').localeCompare(a.created ?? ''),
  oldest: (a, b) => (a.created ?? '').localeCompare(b.created ?? ''),
  'price-asc': (a, b) => (a.price ?? 0) - (b.price ?? 0),
  'price-desc': (a, b) => (b.price ?? 0) - (a.price ?? 0),
  name: (a, b) =>
    (a.title ?? a.name ?? '').localeCompare(b.title ?? b.name ?? ''),
  popular: (a, b) =>
    ((b as AssetWithPurchaseInfo).owners ?? 0) - ((a as AssetWithPurchaseInfo).owners ?? 0),
}
