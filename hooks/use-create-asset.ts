'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Asset, AssetType } from '@/lib/types'

interface CreateAssetArgs {
  name: string
  title?: string
  description?: string
  content?: string
  type: AssetType
  path?: string | null
}

export const useCreateAsset = () => {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, title, description, content, type, path }: CreateAssetArgs) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('assets')
        .insert({
          user_id: session.user.id,
          name,
          title: title || undefined,
          description: description || undefined,
          content: content || undefined,
          type,
          path: path || null
        })
        .select()
        .single()

      if (error) throw error
      return data as Asset
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    }
  })
}
