'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Asset, Assets, AssetType, AssetMap, Mixins, MomentWithPhotos } from '@/lib/types'

export const useMixins = (data: Mixins) => {
  const supabase = createClient()
  const ids = Object.values(data || {})
        .filter((id): id is string => !!id)

  return useQuery({
    queryKey: ['mixins', ids],
    queryFn: async () => {
      // If no asset IDs, return empty object
      if (ids.length === 0) {
        return new Map<string, Asset>()
      }
      const { data: assets, error } = await supabase
        .from('assets')
        .select('*')
        .in('id', ids)
      if (error) throw error
      const assetsMap = new Map<string, Asset>(
        (assets || []).map(asset => [asset.id, asset])
      )
      return assetsMap
    },
    staleTime: 5 * 60 * 1000 // 5 minutes - assets don't change frequently
  })
}
