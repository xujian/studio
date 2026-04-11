'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/avatar'
import { Button } from '@/components/button'
import { Heart } from 'lucide-react'
import type { Post, Profile } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useLikePost } from '@/hooks/use-posts'
import { MomentCarousel } from '@/components/moment-carousel'

interface PostCardProps extends React.HTMLAttributes<HTMLDivElement> {
  post: Post
  href: string
}

export function PostCard({ post, href, className }: PostCardProps) {
  const router = useRouter()
  const like = useLikePost()
  const { moment, author } = post
  const [liked, setLiked] = React.useState(post.liked)
  const [likesCount, setLikesCount] = React.useState(post.likes)

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const next = !liked
    setLiked(next)
    setLikesCount((prev: number) => next ? prev + 1 : prev - 1)
    like.mutate(
      { postId: post.id, liked },
      { onError: () => { setLiked(liked); setLikesCount(post.likes) } }
    )
  }

  return (
    <div className="cursor-pointer" onClick={() => router.push(href)}>
      <MomentCarousel moment={moment}>
        <Avatar
          user={author as Profile}
          className="absolute top-1 left-1 size-8 opacity-0 transition-opacity group-hover:opacity-100" />
        <Button
          size="icon"
          onClick={handleLike}
          disabled={like.isPending}
          aria-label={liked ? `Unlike post (${likesCount} likes)` : `Like post (${likesCount} likes)`}
          aria-pressed={liked}
          className="absolute top-1 right-1 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400">
          <Heart className={cn('size-4', liked && 'fill-red-500 text-red-500')} />
        </Button>
      </MomentCarousel>
    </div>
  )
}
