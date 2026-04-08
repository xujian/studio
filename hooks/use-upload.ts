'use client'

import { useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { random } from '@/lib/utils'
import { toJpg } from '@/lib/utils/image'

type PathOption =
  | string
  | ((opts: { userId: string }) => string)

interface UploadOptions {
  bucket?: string,
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
  path: string
  bucket: string
}

export type UploadPayload = {
  file: File,
  dir: string,
}

const defaultPath: PathOption = ({ userId }) => `${userId}`

export const useUpload = ({ bucket = 'uploads', path = defaultPath }: UploadOptions = {}) => {
  const supabase = createClient()

  const { mutate, isPending } = useMutation({
    mutationFn: async (payload: File | UploadPayload): Promise<UploadResult> => {
      let file: File | null = null,
        dir = ''
      if ('dir' in payload) {
        file = payload.file
        dir = payload.dir
      } else {
        file = payload
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')
      file = await toJpg(file)
      const filename = `${random()}.jpg`
      const fullPath = [
        typeof path === 'function'
          ? path({ userId: session.user.id })
          : path,
        ...dir ? [dir] : [],
        filename
      ].join('/')
      const formData = new FormData()
      formData.append('file', file, filename)
      formData.append('bucket', bucket)
      formData.append('path', fullPath)
      const res = await fetch('/api/assets/image', {
        method: 'POST',
        body: formData
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }
      return { filename, path: fullPath, bucket }
    }
  })

  const remove = async (bucket: string, storagePath: string) => {
    await supabase.storage.from(bucket).remove([storagePath])
  }

  return { upload: mutate, remove, uploading: isPending }
}
