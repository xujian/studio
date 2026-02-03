'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { MomentWithPhotos } from '@/lib/types'

interface EngineParams {
  prompt: string
  mixins?: { face?: string }
  moment?: string | null
  promptEdited?: boolean
}

export const useEngine = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ prompt, mixins, moment, promptEdited }: EngineParams) => {
      const response = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mixins, moment, promptEdited }),
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
