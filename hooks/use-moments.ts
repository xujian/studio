'use client'

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient
} from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { MomentWithPhotos } from '@/lib/types'

const PAGE_SIZE = 12

export const useMoments = () => {
  const supabase = createClient()

  return useInfiniteQuery({
    queryKey: ['moments'],
    queryFn: async ({ pageParam = 0 }) => {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      if (!session) return { moments: [], hasMore: false }

      // Single query with Supabase relations
      const { data, error } = await supabase
        .from('moments')
        .select(
          `
          *,
          photos(*)
        `
        )
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1)

      if (error) throw error

      const moments = (data || []) as MomentWithPhotos[]
      const hasMore = moments.length === PAGE_SIZE

      return { moments, hasMore }
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined
      return allPages.length * PAGE_SIZE
    },
    initialPageParam: 0
  })
}

export const useDeleteMoment = () => {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Photos will be deleted automatically via CASCADE
      const { error } = await supabase.from('moments').delete().eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moments'] })
    }
  })
}
