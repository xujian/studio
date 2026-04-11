'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Mixins, AssetType, MomentWithPhotos } from '@/lib/types'

interface EngineParams {
  momentId?: string | null
  prompt: string
  /**
   * Reference image to generate prompt
   */
  reference?: string,
  /**
   * mixins to revise the final prompt
   */
  mixins?: Mixins
}

export const useEngine = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      prompt,
      mixins = {},
      momentId = '',
      reference = '' }: EngineParams) => {
      const response = await fetch('/api/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mixins, reference, momentId }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate')
      }
      return response.json() as Promise<MomentWithPhotos>
    },
    onSuccess: (raw: MomentWithPhotos) => {
      const newMoment: MomentWithPhotos = {
        ...raw,
        photos: raw.photos.map(p => ({ ...p, user: raw.user })),
      }
      type MomentsPage = { moments: MomentWithPhotos[]; [key: string]: unknown }
      type MomentsData = { pages: MomentsPage[]; [key: string]: unknown }
      queryClient.setQueryData(['moments'], (oldData: MomentsData | undefined) => {
        if (!oldData) return oldData

        // Check if moment already exists (retry mode) — update it in place
        let found = false
        const newPages = oldData.pages.map((page: MomentsPage) => {
          const idx = page.moments.findIndex((m: MomentWithPhotos) => m.id === newMoment.id)
          if (idx !== -1) {
            found = true
            const moments = [...page.moments]
            moments[idx] = newMoment
            return { ...page, moments }
          }
          return page
        })

        if (!found) {
          // New moment — prepend to first page
          newPages[0] = {
            ...newPages[0],
            moments: [newMoment, ...newPages[0].moments]
          }
        }

        return { ...oldData, pages: newPages }
      })
    },
  })
}
