'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Image from 'next/image'
import type { AssetType, MomentWithPhotos } from '@/lib/types'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Badge,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from '@/components/ui'
import { cn } from '@/lib/utils'
import { assetTypes } from '@/lib/constants'
import { useMixins } from '@/hooks/use-mixins'

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
  const currentPhoto = moment.photos[current]
  const merged = {
    ...moment.mixins,
    ...currentPhoto?.mixins
  }
  // Fetch mixins and assets for current photo
  const { data: assetsMap } = useMixins(merged)
  const nonFaceMixins = Object.entries(merged)
    .filter(([key]) => key !== 'face')
  const emptyAssets = Array(4 - (nonFaceMixins.length % 4)).fill(null)

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
          className="absolute inset-0 bg-black/50! glass"
          initial={{ opacity: 0 }}
          animate={{ opacity: isDragging ? 0.5 : 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        {/* Photo Container with Carousel */}
        <div className="relative z-10 w-full h-full flex justify-between">
          <div className="flex-1"></div>
          <div className="flex-0 aspect-9/16 p-4">
            {hasMultiplePhotos ? (
              <Carousel
                setApi={setApi}
                opts={{
                  loop: false,
                  startIndex: initialIndex >= 0 ? initialIndex : 0
                }}
                className="carousel h-full w-full"
              >
                <CarouselContent className="carousel-content h-full">
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
                }}>
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
          <div className="attributes flex-1">
            <div className="@container pr-4 pt-16 flex flex-col gap-4">
              <div className="face relative">
                <Badge className="absolute bg-white/50 top-1 left-1">Face</Badge>
                <img
                  alt="face"
                  src={merged?.face
                    ? assetsMap?.get(merged.face)?.url || '/face.png'
                    : '/face.png'}
                  className="w-full h-full object-cover"
                />
              </div>
              { nonFaceMixins.length > 0 && (
              <div className="mixins grid grid-cols-2 @sm:grid-cols-3 @lg:grid-cols-4 border bg-white/10 rounded-2xl gap-px overflow-hidden">
                {nonFaceMixins.map(([type, assetId]) => {
                  const assetType = assetTypes.find(t => t.type === type)
                  const displayName = assetType?.name || type
                  const asset = assetId && assetsMap ? assetsMap.get(assetId) : null
                  return (
                    <div key={type} className="mixin-item relative h-20 bg-black/75 flex items-center justify-center overflow-hidden">
                      <Badge className="absolute bg-white/50 top-1 left-1 z-10">{displayName}</Badge>
                      {asset?.url
                        ? (
                          <img
                            alt={asset.name || displayName}
                            src={asset.url}
                            className="w-full h-full object-cover"
                          />
                        )
                        : (
                          <Badge className="bg-black/50 text-white">
                            {asset?.name || displayName}
                          </Badge>
                        )
                      }
                    </div>
                  )
                })
              }
              {emptyAssets.map((_, index) => (
                <div key={`empty-${index}`} className="mixin-item h-20 bg-black/75" />
              ))}
              </div>
              )}
              <div className="bg-linear-to-t from-black/80 to-black/40 rounded p-4 border">
                <motion.div
                  className="max-h-24 overflow-clip"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}>
                  <p className="text-white text-sm">{moment.prompt}</p>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <Button
          onClick={onClose}
          variant="outline"
          size="icon"
          className="absolute top-4 right-4 z-20">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </AnimatePresence>
  )
}
