'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Asset } from '@/lib/types'

export const useAssets = () => {
  const supabase = createClient()

  return useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      if (!session) return []

      // Single RPC call to get user's own assets + purchased assets
      const { data, error } = await supabase.rpc('get_user_assets', {
        user_uuid: session.user.id
      })

      if (error) throw error
      return (data || []) as Asset[]
    },
    staleTime: 5 * 60 * 1000 // 5 minutes - assets don't change frequently
  })
}
