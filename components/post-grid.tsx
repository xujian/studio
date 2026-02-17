'use client'

import { useState } from 'react'
import { LayoutGroup } from 'motion/react'
import { PostCard } from '@/components/post-card'
import { MomentView } from '@/components/moment-view'
import { StaggerGrid } from '@/components/stagger-grid'
import { MomentSkeleton } from '@/components/moment-skeleton'
import { Button } from '@/components/ui'
import { usePosts } from '@/hooks/use-posts'
import type { Post } from '@/lib/types'

export function PostGrid() {
  const [selected, setSelected] = useState<{
    post: Post
    initialPhotoId: string
  } | null>(null)

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = usePosts()

  const allPosts =
    data?.pages
      .flatMap(page => page.posts)
      .filter(p => p.moment.photos.length > 0) || []

  // Keep selected post in sync with query data
  const selectedPost = selected
    ? allPosts.find(p => p.id === selected.post.id) || selected.post
    : null

  if (isLoading) {
    return (
      <StaggerGrid className="w-full grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 12 }).map((_, i) => (
          <MomentSkeleton key={i} />
        ))}
      </StaggerGrid>
    )
  }

  if (error) {
    return (
      <div className="text-destructive">
        Failed to load posts: {error.message}
      </div>
    )
  }

  if (allPosts.length === 0) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        No posts yet. Be the first to share a moment!
      </div>
    )
  }

  return (
    <>
      <LayoutGroup>
        <StaggerGrid className="w-full grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-5">
          {allPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onClick={p =>
                setSelected({
                  post: p,
                  initialPhotoId: p.moment.photos[0]?.id
                })
              }
            />
          ))}
          {hasNextPage && (
            <div
              className="relative flex aspect-9/16 w-full items-center justify-center rounded-2xl bg-muted p-4"
              key="load-more">
              <Button
                className="w-full rounded-full"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                variant="outline">
                {isFetchingNextPage ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </StaggerGrid>
      </LayoutGroup>
      {selectedPost && selected && (
        <MomentView
          moment={selectedPost.moment}
          initialPhotoId={selected.initialPhotoId}
          onClose={() => setSelected(null)}
          readOnly
          author={selectedPost.author}
        />
      )}
    </>
  )
}
