'use client'

import * as React from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from '@/components/ui'
import { Photo } from '@/components/photo'
import type { MomentWithPhotos } from '@/lib/types'
import { cn } from '@/lib/utils'

interface MomentCardProps {
  moment: MomentWithPhotos
}

export function MomentCard({ moment }: MomentCardProps) {
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

  React.useEffect(() => {
    if (!api) return
    api.reInit()
    setCount(api.scrollSnapList().length)
  }, [api, moment.photos.length])

  // Single photo - no carousel
  if (!hasMultiplePhotos) {
    return (
      <div className="relative aspect-9/16 w-full overflow-hidden rounded-2xl bg-muted">
        <Photo data={moment.photos[0]} />
      </div>
    )
  }

  // Multiple photos - carousel
  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      <Carousel setApi={setApi} opts={{ loop: false }}>
        <CarouselContent>
          {moment.photos.map(photo => (
            <CarouselItem key={photo.id}>
              <div className="relative aspect-9/16 w-full overflow-hidden rounded bg-muted">
                <Photo data={photo} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div
          className={cn(
            'absolute bottom-6 h-8 w-full transition-opacity duration-200',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
          onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
          <CarouselPrevious className="left-2 bg-black!" />
          <CarouselNext className="right-2 bg-black!" />
        </div>
      </Carousel>
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
    </div>
  )
}
