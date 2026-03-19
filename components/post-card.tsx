'use client'

import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'
import { motion } from 'motion/react'
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from '@/components/ui'
import { Heart } from 'lucide-react'
import type { Post } from '@/lib/types'
import { cn, photoUrl } from '@/lib/utils'
import { useLikePost } from '@/hooks/use-posts'

interface PostCardProps {
  post: Post
  href: string
}

export function PostCard({ post, href }: PostCardProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const [count, setCount] = React.useState(0)
  const like = useLikePost()

  const { moment, author } = post
  const hasMultiplePhotos = moment.photos.length > 1

  React.useEffect(() => {
    if (!api) return
    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap())
    api.on('select', () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    like.mutate({ postId: post.id, liked: post.liked })
  }

  const overlay = (
    <div className="absolute right-0 bottom-0 left-0 z-10 flex items-center justify-between bg-linear-to-t from-black/80 to-transparent p-3 pt-10">
      <div className="flex items-center gap-2">
        <Avatar className="size-6">
          {author.avatar && <AvatarImage src={author.avatar} alt={author.name || ''} />}
          <AvatarFallback className="text-xs">
            {(author.name || '?')[0]}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium text-white">
          {author.name || 'Anonymous'}
        </span>
      </div>
      <button
        onClick={handleLike}
        disabled={like.isPending}
        aria-label={post.liked ? `Unlike post (${post.likes_count} likes)` : `Like post (${post.likes_count} likes)`}
        aria-pressed={post.liked}
        className="flex cursor-pointer items-center gap-1 text-white transition-colors hover:text-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground rounded-sm">
        <Heart
          className={cn('size-4', post.liked && 'fill-red-500 text-red-500')}
        />
        {post.likes_count > 0 && (
          <span className="text-xs">{post.likes_count}</span>
        )}
      </button>
    </div>
  )

  if (!hasMultiplePhotos) {
    const photo = moment.photos[0]
    return (
      <div
        className="relative aspect-9/16 w-full cursor-pointer overflow-hidden rounded-2xl bg-muted"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}>
        <Link href={href}>
          <motion.div
            className="relative h-full w-full"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}>
            <Image
              className="object-cover"
              src={photoUrl(moment.user_id, moment.id, photo.id)}
              alt={moment.title || 'Photo'}
              fill
              sizes="(min-width: 1280px) 16vw, (min-width: 768px) 25vw, 50vw"
              loading="lazy"

            />
          </motion.div>
        </Link>
        {overlay}
      </div>
    )
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      <Carousel setApi={setApi} opts={{ loop: false }}>
        <CarouselContent>
          {moment.photos.map(photo => (
            <CarouselItem key={photo.id}>
              <div className="relative aspect-9/16 w-full cursor-pointer overflow-hidden rounded bg-muted">
                <Link href={href}>
                  <motion.div
                    className="relative h-full w-full"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}>
                    <Image
                      className="object-cover"
                      src={photoUrl(moment.user_id, moment.id, photo.id)}
                      alt={moment.title || 'Photo'}
                      fill
                      sizes="(min-width: 1280px) 16vw, (min-width: 768px) 25vw, 50vw"
                      loading="lazy"
        
                    />
                  </motion.div>
                </Link>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div
          className={cn(
            'absolute bottom-6 h-8 w-full transition-opacity duration-200',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
          onClick={e => { e.preventDefault(); e.stopPropagation() }}>
          <CarouselPrevious className="left-2 bg-black!" />
          <CarouselNext className="right-2 bg-black!" />
        </div>
      </Carousel>
      {/* Dots indicator */}
      <div role="tablist" aria-label="Photo navigation" className="absolute right-0 bottom-14 left-0 z-10 flex justify-center gap-1.5">
        {Array.from({ length: count }).map((_, index) => (
          <button
            key={index}
            role="tab"
            aria-selected={index === current}
            aria-label={`Photo ${index + 1}`}
            onClick={(e) => { e.stopPropagation(); api?.scrollTo(index) }}
            className={cn(
              'h-1.5 w-1.5 rounded-full transition-all duration-200 cursor-pointer',
              index === current ? 'w-3 bg-white' : 'bg-white/50'
            )}
          />
        ))}
      </div>
      {overlay}
    </div>
  )
}
