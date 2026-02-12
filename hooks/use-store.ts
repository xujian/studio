'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { AssetWithPurchaseInfo, AssetType } from '@/lib/types'
import { assetTypes } from '@/lib/constants'

export type StoreSection = {
  type: AssetType
  name: string
  assets: AssetWithPurchaseInfo[]
}

export const useStore = () => {
  const supabase = createClient()

  return useQuery({
    queryKey: ['store'],
    queryFn: async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      const userId = session?.user?.id ?? '00000000-0000-0000-0000-000000000000'

      const { data, error } = await supabase.rpc('get_store_assets', {
        user_uuid: userId
      })

      if (error) throw error

      const assets = (data || []) as AssetWithPurchaseInfo[]

      // Group by type, preserving assetTypes order
      const sections: StoreSection[] = assetTypes
        .map(t => ({
          type: t.type as AssetType,
          name: t.name,
          assets: assets.filter(a => a.type === t.type)
        }))
        .filter(s => s.assets.length > 0)

      return sections
    },
    staleTime: 5 * 60 * 1000
  })
}
