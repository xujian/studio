'use client'

import { useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface UploadOptions {
  bucket?: string
}

interface UploadResult {
  filename: string
  path: string
}

function randomHex(bytes = 8) {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
}

export const useUpload = ({ bucket = 'uploads' }: UploadOptions = {}) => {
  const supabase = createClient()

  const { mutate, isPending } = useMutation({
    mutationFn: async (file: File): Promise<UploadResult> => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const ext = file.name.split('.').pop() || 'jpg'
      const filename = `${randomHex()}.${ext}`
      const path = `${session.user.id}/${filename}`

      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { contentType: file.type, upsert: false })

      if (error) throw error

      return { filename, path }
    },
  })

  return { upload: mutate, uploading: isPending }
}
