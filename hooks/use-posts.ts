'use client'

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient
} from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Post } from '@/lib/types'

const PAGE_SIZE = 20

export const usePosts = (initialPosts?: Post[]) => {
  const supabase = createClient()

  return useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: async ({ pageParam = 0 }) => {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      const userId = session?.user?.id ?? '00000000-0000-0000-0000-000000000000'

      const { data, error } = await supabase.rpc('get_posts', {
        user_uuid: userId,
        page_limit: PAGE_SIZE,
        page_offset: pageParam
      })

      if (error) throw error
      const posts = (data || []) as Post[]
      const hasMore = posts.length === PAGE_SIZE
      return { posts, hasMore }
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined
      return allPages.length * PAGE_SIZE
    },
    initialPageParam: 0,
    ...(initialPosts && {
      initialData: {
        pages: [{ posts: initialPosts, hasMore: initialPosts.length === PAGE_SIZE }],
        pageParams: [0]
      }
    })
  })
}

export const useLikePost = () => {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      if (!session) throw new Error('Login required')

      if (liked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', session.user.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: session.user.id })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    }
  })
}

export const usePublishPost = () => {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (momentId: string) => {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      if (!session) throw new Error('Login required')

      const { error } = await supabase
        .from('posts')
        .insert({ user_id: session.user.id, moment_id: momentId })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['moments'] })
    }
  })
}

export const useUnpublishPost = () => {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (momentId: string) => {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('moment_id', momentId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['moments'] })
    }
  })
}
