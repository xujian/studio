'use client'

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient
} from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useBus } from '@/lib/bus'
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
        .eq('user', session.user.id)
        .order('created', { ascending: false })
        .order('created', { referencedTable: 'photos', ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1)
      if (error) throw error
      const moments = (data || []).map(moment => ({
        ...moment,
        photos: (moment.photos ?? []).map((photo: Record<string, unknown>) => ({
          ...photo,
          user: moment.user,
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
  const $bus = useBus()
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
      // Fetch this photo's mixins + parent moment (mixins, sibling photos)
      const { data: photo } = await supabase
        .from('photos')
        .select('mixins')
        .eq('id', photoId)
        .single()

      const { data: moment } = await supabase
        .from('moments')
        .select('mixins, photos(id, mixins)')
        .eq('id', momentId)
        .single()

      const siblingPhotos = (moment?.photos ?? [] as { id: string; mixins: Record<string, string> | null }[])
        .filter((p: { id: string }) => p.id !== photoId)
      const isLastPhoto = siblingPhotos.length === 0

      const photoMixinIds = collectMixinIds(photo?.mixins)
      if (photoMixinIds.length) {
        // Which ad-hoc IDs are still referenced elsewhere
        const otherIds = new Set([
          ...collectMixinIds(moment?.mixins),
          ...siblingPhotos.flatMap((p: { mixins: Record<string, string> | null }) => collectMixinIds(p.mixins))
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

      if (isLastPhoto) {
        // No photos left — remove the now-empty moment and its own ad-hoc assets
        await deleteAdhocAssets(supabase, collectMixinIds(moment?.mixins))
        const { error: momentError } = await supabase
          .from('moments')
          .delete()
          .eq('id', momentId)
        if (momentError) throw momentError
        $bus.emit('moment:deleted', { momentId })
      }
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
  const $bus = useBus()
  return useMutation({
    mutationFn: async (id: string) => {
      // Fetch moment + photos (ids, mixins) for storage cleanup and ad-hoc asset cleanup
      const { data: moment } = await supabase
        .from('moments')
        .select('user, mixins, photos(id, mixins)')
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
          (p: { id: string }) => `${moment.user}/${id}/${p.id}.jpg`
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
      $bus.emit('moment:deleted', { momentId: id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moments'] })
    }
  })
}
