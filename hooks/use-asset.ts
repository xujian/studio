'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Asset } from '@/lib/types'

export const useAsset = (id: string | undefined) => {
  const supabase = createClient()

  return useQuery({
    queryKey: ['assets', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id!)
        .single()

      if (error) throw error
      return data as Asset
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000
  })
}

export const useSingleAsset = () => {
  const supabase = createClient()

  const fetch = async (id: string): Promise<Asset | null> => {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data as Asset
  }

  return { fetch }
}
