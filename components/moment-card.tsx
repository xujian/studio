'use client'

import Image from 'next/image'
import * as React from 'react'
import { motion } from 'motion/react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from '@/components/ui'
import type { Photo, MomentWithPhotos } from '@/lib/types'
import { cn } from '@/lib/utils'

interface MomentCardProps {
  moment: MomentWithPhotos
  onPhotoClick: (photo: Photo, moment: MomentWithPhotos) => void
}

export function MomentCard({ moment, onPhotoClick }: MomentCardProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const [count, setCount] = React.useState(0)

  const hasMultiplePhotos = moment.photos.length > 1

  React.useEffect(() => {
    if (!api) return

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap())

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])

  // Single photo - no carousel
  if (!hasMultiplePhotos) {
    const photo = moment.photos[0]
    return (
      <motion.div
        layoutId={photo.id}
        className="relative aspect-9/16 w-full cursor-pointer overflow-hidden rounded bg-muted"
        onClick={() => onPhotoClick(photo, moment)}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        <Image
          className="object-cover"
          src={photo.url}
          alt={moment.prompt}
          fill
          sizes="(min-width: 1280px) 16vw, (min-width: 768px) 25vw, 50vw"
          loading="lazy"
          unoptimized
        />
      </motion.div>
    )
  }

  // Multiple photos - carousel
  return (
    <motion.div
      className="relative overflow-hidden rounded"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <Carousel setApi={setApi} opts={{ loop: false }}>
        <CarouselContent>
          {moment.photos.map(photo => (
            <CarouselItem key={photo.id}>
              <motion.div
                layoutId={photo.id}
                className="relative aspect-9/16 w-full cursor-pointer overflow-hidden rounded bg-muted"
                onClick={() => onPhotoClick(photo, moment)}>
                <Image
                  className="object-cover"
                  src={photo.url}
                  alt={moment.prompt}
                  fill
                  sizes="(min-width: 1280px) 16vw, (min-width: 768px) 25vw, 50vw"
                  loading="lazy"
                  unoptimized
                />
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div
          className={cn(
            'absolute bottom-6 h-8 w-full transition-opacity duration-200',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
          onClick={(e) => { e.preventDefault(); e.stopPropagation()}}>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </div>
      </Carousel>

      {/* Dots indicator */}
      <div className="absolute right-0 bottom-2 left-0 z-10 flex justify-center gap-1.5">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'h-1.5 w-1.5 rounded-full transition-all duration-200',
              index === current ? 'w-3 bg-white' : 'bg-white/50'
            )}
          />
        ))}
      </div>
    </motion.div>
  )
}
