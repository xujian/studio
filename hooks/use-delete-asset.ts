'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface DeleteAssetArgs {
  id: string
  path?: string | null
}

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

      // Best-effort storage cleanup — don't throw if this fails
      if (path) {
        await supabase.storage.from('assets').remove([path])
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    }
  })
}
