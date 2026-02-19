'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { PostCard } from '@/components/post-card'
import { MomentView } from '@/components/moment-view'
import { usePosts } from '@/hooks/use-posts'
import type { Post } from '@/lib/types'

type Section = { title: string; posts: Post[] }

export function PostGrid({
  initialPosts,
  sections
}: {
  initialPosts: Post[]
  sections: Section[]
}) {
  const [selected, setSelected] = useState<{
    post: Post
    initialPhotoId: string
  } | null>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePosts(initialPosts)

  // Keep selected post in sync with query data
  const allPosts =
    data?.pages.flatMap(page => page.posts).filter(p => p.moment.photos.length > 0) || []

  const selectedPost = selected
    ? allPosts.find(p => p.id === selected.post.id) || selected.post
    : null

  const handleSelect = (post: Post) => {
    setSelected({ post, initialPhotoId: post.moment.photos[0]?.id })
  }

  return (
    <>
      <div className="flex flex-col gap-10">
        {sections.map(section => (
          <section key={section.title} className="flex flex-col gap-4">
            <h2 className="my-0 text-lg font-semibold">{section.title}</h2>
            <div className="scrollbar-none -mx-16 flex gap-4 overflow-x-auto px-16 pb-4">
              {section.posts.map((post, i) => (
                <motion.div
                  key={post.id}
                  className="w-48 shrink-0 md:w-56"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
                >
                  <PostCard post={post} onClick={handleSelect} />
                </motion.div>
              ))}
            </div>
          </section>
        ))}

        {hasNextPage && (
          <button
            className="mx-auto rounded-full border px-6 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading...' : 'Load more'}
          </button>
        )}
      </div>

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
