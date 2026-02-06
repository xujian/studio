'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Mixins, AssetType, MomentWithPhotos } from '@/lib/types'

interface EngineParams {
  momentId?: string | null
  prompt: string
  reference?: string,
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
    onSuccess: () => {
      // Invalidate moments cache to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['moments'] })
    },
  })
}
