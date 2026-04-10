'use client'

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient
} from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { MomentWithPhotos } from '@/lib/types'

const PAGE_SIZE = 10

const collectMixinIds = (mixins: Record<string, string> | null | undefined): string[] => {
  if (!mixins) return []
  return Object.values(mixins).filter(Boolean)
}

const deleteAdhocAssets = async (
  supabase: ReturnType<typeof createClient>,
  ids: string[]
) => {
  if (!ids.length) return
  const { data: adhocAssets } = await supabase
    .from('assets')
    .select('id, path')
    .in('id', ids)
    .eq('name', '')
  if (!adhocAssets?.length) return
  const storagePaths = adhocAssets.map(a => a.path).filter(Boolean) as string[]
  if (storagePaths.length) {
    await supabase.storage.from('assets').remove(storagePaths)
  }
  await supabase.from('assets').delete().in('id', adhocAssets.map(a => a.id))
}

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
          photos(*),
          posts(id)
        `
        )
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .order('created_at', { referencedTable: 'photos', ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1)
      if (error) throw error
      const moments = (data || []).map(moment => ({
        ...moment,
        photos: (moment.photos ?? []).map((photo: Record<string, unknown>) => ({
          ...photo,
          user_id: moment.user_id,
        })),
        published: !!(moment.posts as { id: string } | null),
      })) as MomentWithPhotos[]
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
      // Fetch this photo's mixins to find ad-hoc assets
      const { data: photo } = await supabase
        .from('photos')
        .select('mixins')
        .eq('id', photoId)
        .single()

      const photoMixinIds = collectMixinIds(photo?.mixins)
      if (photoMixinIds.length) {
        // Fetch parent moment + sibling photos to find which ad-hoc IDs are still referenced
        const { data: moment } = await supabase
          .from('moments')
          .select('mixins, photos(id, mixins)')
          .eq('id', momentId)
          .single()

        const otherIds = new Set([
          ...collectMixinIds(moment?.mixins),
          ...(moment?.photos ?? [] as { id: string; mixins: Record<string, string> | null }[])
            .filter((p: { id: string }) => p.id !== photoId)
            .flatMap((p: { mixins: Record<string, string> | null }) => collectMixinIds(p.mixins))
        ])

        const orphanIds = photoMixinIds.filter(id => !otherIds.has(id))
        await deleteAdhocAssets(supabase, orphanIds)
      }

      const path = `${userId}/${momentId}/${photoId}.jpg`
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

export const useUpdateMomentTitle = () => {
  const queryClient = useQueryClient()
  const supabase = createClient()
  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase
        .from('moments')
        .update({ title })
        .eq('id', id)
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
      // Fetch moment + photos (ids, mixins) for storage cleanup and ad-hoc asset cleanup
      const { data: moment } = await supabase
        .from('moments')
        .select('user_id, mixins, photos(id, mixins)')
        .eq('id', id)
        .single()

      // Delete ad-hoc assets referenced by this moment and its photos
      // (safe to bulk-delete: the entire moment tree is being removed)
      const momentMixinIds = collectMixinIds(moment?.mixins)
      const photoMixinIds = (moment?.photos ?? [] as { mixins: Record<string, string> | null }[])
        .flatMap((p: { mixins: Record<string, string> | null }) => collectMixinIds(p.mixins))
      await deleteAdhocAssets(supabase, [...new Set([...momentMixinIds, ...photoMixinIds])])

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
