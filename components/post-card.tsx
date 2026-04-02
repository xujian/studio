'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui'
import { Button } from '@/components/button'
import { Heart } from 'lucide-react'
import type { Post } from '@/lib/types'
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

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    like.mutate({ postId: post.id, liked: post.liked })
  }

  return (
    <div className="cursor-pointer" onClick={() => router.push(href)}>
      <MomentCarousel moment={moment}>
        <Avatar className="absolute top-1 left-1 size-8 opacity-0 transition-opacity group-hover:opacity-100">
          {author.avatar && <AvatarImage src={author.avatar} alt={author.name || ''} />}
        </Avatar>
        <Button
          size="icon"
          onClick={handleLike}
          disabled={like.isPending}
          aria-label={post.liked ? `Unlike post (${post.likes_count} likes)` : `Like post (${post.likes_count} likes)`}
          aria-pressed={post.liked}
          className="absolute top-1 right-1 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400">
          <Heart className={cn('size-4', post.liked && 'fill-red-500 text-red-500')} />
        </Button>
      </MomentCarousel>
    </div>
  )
}
