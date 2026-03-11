'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { AssetType } from '@/lib/types'

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

      const { error } = await supabase
        .from('assets')
        .insert({
          user_id: session.user.id,
          name,
          title: title || undefined,
          description: description || undefined,
          content: content || undefined,
          type,
          path: path || null,
          is_public: false
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    }
  })
}
