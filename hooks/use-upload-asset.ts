'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { AssetType } from '@/lib/types'

function randomHex(bytes = 8) {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
}

interface UploadAssetArgs {
  file: File
  name: string
  type: AssetType
}

export const useUploadAsset = () => {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, name, type }: UploadAssetArgs) => {
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are supported')
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const ext = file.name.split('.').pop() || 'jpg'
      const filename = `${session.user.id}/${randomHex()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filename, file, { contentType: file.type, upsert: false })

      if (uploadError) throw uploadError

      const { error: insertError } = await supabase
        .from('assets')
        .insert({ user_id: session.user.id, name, type, path: filename, is_public: false })

      if (insertError) {
        await supabase.storage.from('assets').remove([filename])
        throw insertError
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    }
  })
}
