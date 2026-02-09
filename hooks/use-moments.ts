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
        .order('created_at', { referencedTable: 'photos', ascending: false })
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

export const useDeletePhoto = () => {
  const queryClient = useQueryClient()
  const supabase = createClient()
  return useMutation({
    mutationFn: async ({
      userId,
      momentId,
      photoId
    }: {
      userId: string
      momentId: string
      photoId: string
    }) => {
      const path = `${userId}/${momentId}/${photoId}.jpg`
      console.log('delete photo--------', path)
      const { error: storageError } = await supabase.storage
        .from('photos')
        .remove([path])
      if (storageError) {
        console.error('Storage delete failed:', storageError)
      }
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moments'] })
    }
  })
}

export const useDeleteMoment = () => {
  const queryClient = useQueryClient()
  const supabase = createClient()
  return useMutation({
    mutationFn: async (id: string) => {
      // Fetch moment + photo IDs to derive storage paths
      const { data: moment } = await supabase
        .from('moments')
        .select('user_id, photos(id)')
        .eq('id', id)
        .single()
      if (moment?.photos?.length) {
        const paths = moment.photos.map(
          (p: { id: string }) => `${moment.user_id}/${id}/${p.id}.jpg`
        )
        const { error: storageError } = await supabase.storage
          .from('photos')
          .remove(paths)
        if (storageError) {
          console.error('Storage delete failed:', storageError)
        }
      }
      // Delete moment (photos cascade-deleted from DB)
      const { error } = await supabase.from('moments').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moments'] })
    }
  })
}
