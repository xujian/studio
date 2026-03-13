'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface DeleteAssetArgs {
  id: string
  path?: string | null
}

/** Delete a user-created (custom) asset — removes from DB and storage */
export const useDeleteAsset = () => {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, path }: DeleteAssetArgs) => {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id)

      if (error) throw error

      if (path) {
        await supabase.storage.from('assets').remove([path])
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    }
  })
}

/** Remove a purchased asset from the user's library — deletes the purchase record only */
export const useRemovePurchase = () => {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (assetId: string) => {
      const { data: { session } } = await supabase.auth.getSession()
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('asset_id', assetId)
        .eq('buyer_id', session!.user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    }
  })
}
