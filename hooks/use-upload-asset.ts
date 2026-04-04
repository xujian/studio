'use client'

import { createClient } from '@/lib/supabase/client'
import type { AssetType } from '@/lib/types'
import { random } from '@/lib/utils'

/**
 * Upload a file to the assets bucket at `assets/{userId}/{type}/{filename}`.
 * Returns the storagePath (without bucket prefix) suitable for DB storage.
 */
export const useUploadAsset = () => {
  const supabase = createClient()

  const upload = async (file: File, type: AssetType): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const ext = file.name.split('.').pop() || 'jpg'
    const storagePath = `${session.user.id}/${type}/${random()}.${ext}`

    const { error } = await supabase.storage
      .from('assets')
      .upload(storagePath, file, { contentType: file.type, upsert: false })

    if (error) throw error
    return storagePath
  }

  return { upload }
}
