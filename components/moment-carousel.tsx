'use client'

import Image from 'next/image'
import * as React from 'react'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from '@/components/ui'
import type { MomentWithPhotos, Photo } from '@/lib/types'
import { cn, photoUrl } from '@/lib/utils'

type MomentCarouselProps = {
  moment: MomentWithPhotos
  photo?: string
  onChange?: (photo: Photo, index: number) => void
  onClose?: () => void
  children?: React.ReactNode
  className?: string
  sizes?: string
}

export function MomentCarousel({
  moment,
  photo: initialPhotoId,
  onChange,
  onClose,
  children,
  className,
  sizes = '(min-width: 1280px) 16vw, (min-width: 768px) 25vw, 50vw'
}: MomentCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const [count, setCount] = React.useState(0)

  const router = useRouter()
  const { photos } = moment
  const hasMultiplePhotos = photos.length > 1
  const initialIndex = initialPhotoId
    ? photos.findIndex(p => p.id === initialPhotoId)
    : -1

  React.useEffect(() => {
    if (!api) return
    api.reInit()
    const maxIndex = photos.length - 1
    const snap = api.selectedScrollSnap()
    if (snap > maxIndex) api.scrollTo(Math.max(0, maxIndex), true)
    const idx = api.selectedScrollSnap()
    setCurrent(idx)
    setCount(api.scrollSnapList().length)
    onChange?.(photos[idx], idx)
    const onSelect = () => {
      const i = api.selectedScrollSnap()
      setCurrent(i)
      onChange?.(photos[i], i)
    }
    api.on('select', onSelect)
    return () => {
      api.off('select', onSelect)
    }
  }, [api, photos.length])

  React.useEffect(() => {
    if (api && initialIndex >= 0) {
      api.scrollTo(initialIndex, true)
    }
  }, [api, initialIndex])

  const dragProps = onClose
    ? {
        drag: 'y' as const,
        dragConstraints: { top: 0, bottom: 300 },
        dragElastic: 0.2,
        onDragEnd: (
          _e: MouseEvent | TouchEvent | PointerEvent,
          info: { offset: { y: number } }
        ) => {
          if (info.offset.y > 150) onClose()
        }
      }
    : undefined

  const renderPhoto = (p: Photo) => (
    <motion.div
      layoutId={p.id}
      className={cn(
        'relative h-full w-full',
        !onClose && 'cursor-pointer',
        onClose && 'cursor-grab active:cursor-grabbing'
      )}
      whileHover={!onClose ? { scale: 1.05 } : undefined}
      transition={{ duration: 0.3 }}
      onClick={!onClose ? (e) => {
        e.stopPropagation()
        router.push(`/moments/${p.moment}?photo=${p.id}`)
      } : undefined}
      {...dragProps}>
      <Image
        src={photoUrl(moment.user, moment.id, p.id)}
        alt={moment.title || 'Photo'}
        fill
        loading="lazy"
        className="object-cover"
        sizes={sizes}
      />
    </motion.div>
  )

  if (!hasMultiplePhotos) {
    return (
      <div
        className={cn(
          'group relative aspect-9/16 w-full overflow-hidden rounded-3xl bg-muted',
          className
        )}>
        {renderPhoto(photos[0])}
        {children}
      </div>
    )
  }

  return (
    <div
      className={cn('moment-carousel group relative overflow-hidden rounded-3xl', className)}>
      <Carousel
        setApi={setApi}
        opts={{
          loop: false,
          startIndex: initialIndex >= 0 ? initialIndex : 0
        }}>
        <CarouselContent>
          {photos.map(p => (
            <CarouselItem key={p.id}>
              <div className="carousel-item relative aspect-9/16 w-full overflow-hidden bg-muted">
                {renderPhoto(p)}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div
          className="absolute bottom-1 h-8 w-full z-11 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100"
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
          }}>
          <CarouselPrevious
            size="icon-lg"
            className="left-1 border-0 bg-secondary! hover:bg-black!"
            aria-label="Previous photo"
          />
          <CarouselNext
            size="icon-lg"
            className="right-1 border-0 bg-secondary! hover:bg-black!"
            aria-label="Next photo"
          />
        </div>
        <div
          role="tablist"
          aria-label="Photo navigation"
          className="absolute right-0 bottom-4 left-0 z-10 flex justify-center gap-1.5">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              role="tab"
              aria-selected={index === current}
              aria-label={`Photo ${index + 1} of ${count}`}
              onClick={e => {
                e.stopPropagation()
                api?.scrollTo(index)
              }}
              className={cn(
                'h-1.5 w-1.5 cursor-pointer rounded-full transition-all duration-200',
                index === current ? 'w-3 bg-white' : 'bg-white/50'
              )}
            />
          ))}
        </div>
      </Carousel>
      {children}
    </div>
  )
}
