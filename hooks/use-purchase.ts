'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export const usePurchase = () => {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (assetId: string) => {
      const { data, error } = await supabase.rpc('purchase_asset', {
        asset_uuid: assetId
      })

      if (error) throw error

      const result = data as { success: boolean; error?: string; remaining_credits?: number }
      if (!result.success) {
        throw new Error(result.error || 'Purchase failed')
      }

      return result
    },
    onSuccess: () => {
      toast.success('Asset purchased!')
      queryClient.invalidateQueries({ queryKey: ['store'] })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}
