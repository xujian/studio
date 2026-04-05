'use client'

import { useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { random } from '@/lib/utils'

type PathOption =
  | string
  | ((opts: { userId: string }) => string)

interface UploadOptions {
  /** Full path including bucket as first segment.
   *  Static string: `"assets/face"` → bucket=assets, path=face/{filename}
   *  Function: `({ userId, filename }) => \`uploads/${userId}/${filename}\``
   *  Default: `({ userId, filename }) => \`uploads/${userId}/${filename}\``
   */
  path?: PathOption
}

export interface UploadResult {
  filename: string
  /** Path within the bucket (no bucket prefix). Suitable for DB storage. */
  storagePath: string
  bucket: string
}

const defaultPath: PathOption = ({ userId }) => `uploads/${userId}`

export const useUpload = ({ path = defaultPath }: UploadOptions = {}) => {
  const supabase = createClient()

  const { mutate, isPending } = useMutation({
    mutationFn: async (file: File): Promise<UploadResult> => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const ext = file.name.split('.').pop() || 'jpg'
      const filename = `${random()}.${ext}`

      const fullPath = typeof path === 'function'
        ? `${path({ userId: session.user.id })}/${filename}`
        : `${path}/${filename}`
      const slashIdx = fullPath.indexOf('/')
      const bucket = fullPath.slice(0, slashIdx)
      const storagePath = fullPath.slice(slashIdx + 1)

      const formData = new FormData()
      formData.append('file', file, filename)
      formData.append('bucket', bucket)
      formData.append('storagePath', storagePath)

      const res = await fetch('/api/assets/image', {
        method: 'POST',
        body: formData
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }

      return { filename, storagePath, bucket }
    },
  })

  const remove = async (bucket: string, storagePath: string) => {
    await supabase.storage.from(bucket).remove([storagePath])
  }

  return { upload: mutate, remove, uploading: isPending }
}
