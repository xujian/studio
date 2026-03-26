'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

/**
 * Promote an asset to the public store.
 * Moves the image from the user's storage path to the public asset path,
 * clears ownership, and sets the default price.
 */
export const usePromoteAsset = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (assetId: string) => {
      const res = await fetch('/api/assets/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error || 'Promote failed')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}
