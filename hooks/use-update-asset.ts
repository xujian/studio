'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { AssetType } from '@/lib/types'

interface UpdateAssetArgs {
  id: string
  name: string
  title?: string
  description?: string
  content?: string
  type: AssetType
  path?: string | null
  price?: number | null
}

export const useUpdateAsset = () => {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, name, title, description, content, type, path, price }: UpdateAssetArgs) => {
      const { error } = await supabase
        .from('assets')
        .update({
          name,
          title: title || undefined,
          description: description || undefined,
          content: content || undefined,
          type,
          path: path || null,
          price: price ?? null,
        })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    }
  })
}
