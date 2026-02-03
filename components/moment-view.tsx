'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Image from 'next/image'
import type { MomentWithPhotos } from '@/lib/types'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from '@/components/ui'
import { cn } from '@/lib/utils'

interface MomentViewProps {
  moment: MomentWithPhotos
  initialPhotoId: string
  onClose: () => void
}

export function MomentView({ moment, initialPhotoId, onClose }: MomentViewProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const [count, setCount] = React.useState(0)

  // Find initial photo index
  const initialIndex = moment.photos.findIndex(p => p.id === initialPhotoId)

  const hasMultiplePhotos = moment.photos.length > 1

  // Set up carousel API
  React.useEffect(() => {
    if (!api) return

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap())

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])

  // Scroll to initial photo
  React.useEffect(() => {
    if (api && initialIndex >= 0) {
      api.scrollTo(initialIndex, true) // true = instant, no animation
    }
  }, [api, initialIndex])

  // ESC key listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: isDragging ? 0.5 : 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Photo Container with Carousel */}
        <div className="relative z-10 max-h-[90vh] max-w-[90vw] h-full aspect-9/16">
          {hasMultiplePhotos ? (
            <Carousel
              setApi={setApi}
              opts={{
                loop: false,
                startIndex: initialIndex >= 0 ? initialIndex : 0
              }}
              className="h-full w-full"
            >
              <CarouselContent className="h-full">
                {moment.photos.map((photo) => (
                  <CarouselItem key={photo.id} className="h-full">
                    <motion.div
                      layoutId={photo.id}
                      className="relative h-full w-full overflow-hidden rounded-lg cursor-grab active:cursor-grabbing"
                      drag="y"
                      dragConstraints={{ top: 0, bottom: 300 }}
                      dragElastic={0.2}
                      onDragStart={() => setIsDragging(true)}
                      onDragEnd={(e, info) => {
                        setIsDragging(false)
                        if (info.offset.y > 150) {
                          onClose()
                        }
                      }}
                    >
                      <Image
                        src={photo.url}
                        alt={moment.prompt}
                        fill
                        className="object-cover w-full h-full"
                        priority
                        unoptimized
                      />
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              {/* Navigation arrows - always visible */}
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />

              {/* Dots indicator */}
              <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-2 z-20">
                {Array.from({ length: count }).map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      'h-2 w-2 rounded-full transition-all duration-200',
                      index === current
                        ? 'bg-white w-4'
                        : 'bg-white/50'
                    )}
                  />
                ))}
              </div>
            </Carousel>
          ) : (
            // Single photo - no carousel
            <motion.div
              layoutId={moment.photos[0].id}
              className="relative h-full w-full overflow-hidden rounded-lg cursor-grab active:cursor-grabbing"
              drag="y"
              dragConstraints={{ top: 0, bottom: 300 }}
              dragElastic={0.2}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={(e, info) => {
                setIsDragging(false)
                if (info.offset.y > 150) {
                  onClose()
                }
              }}
            >
              <Image
                src={moment.photos[0].url}
                alt={moment.prompt}
                fill
                className="object-cover w-full h-full"
                priority
                unoptimized
              />
            </motion.div>
          )}
        </div>

        {/* Close Button */}
        <Button
          onClick={onClose}
          variant="outline"
          size="icon"
          className="absolute top-4 right-4 z-20"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Prompt Overlay */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-black/80 to-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-white text-sm">{moment.prompt}</p>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
