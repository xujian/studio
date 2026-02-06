'use client'

import Image from 'next/image'
import * as React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Badge,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from '@/components/ui'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { assetTypes } from '@/lib/constants'
import type { AssetType, MomentWithPhotos } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useMixins } from '@/hooks/use-mixins'
import { useDeleteMoment } from '@/hooks/use-moments'
import { Loader2, Trash, X } from 'lucide-react'

interface MomentViewProps {
  moment: MomentWithPhotos
  initialPhotoId: string
  onClose: () => void
}

export function MomentView({
  moment,
  initialPhotoId,
  onClose
}: MomentViewProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const [count, setCount] = React.useState(0)
  const deleteMoment = useDeleteMoment()

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
  const nonFaceMixins = Object.entries(merged).filter(([key]) => key !== 'face')
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
          className="glass absolute inset-0 bg-black/50!"
          initial={{ opacity: 0 }}
          animate={{ opacity: isDragging ? 0.5 : 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        {/* Photo Container with Carousel */}
        <div className="relative z-10 flex h-full w-full justify-between">
          <div className="flex-1"></div>
          <div className="aspect-9/16 flex-0 p-4">
            {hasMultiplePhotos ? (
              <Carousel
                setApi={setApi}
                opts={{
                  loop: false,
                  startIndex: initialIndex >= 0 ? initialIndex : 0
                }}
                className="carousel h-full w-full">
                <CarouselContent className="carousel-content h-full">
                  {moment.photos.map(photo => (
                    <CarouselItem key={photo.id} className="h-full">
                      <motion.div
                        layoutId={photo.id}
                        className="relative h-full w-full cursor-grab overflow-hidden rounded-lg active:cursor-grabbing"
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
                          src={photo.url}
                          alt={moment.prompt}
                          fill
                          className="h-full w-full object-cover"
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
                <div className="absolute right-0 bottom-20 left-0 z-20 flex justify-center gap-2">
                  {Array.from({ length: count }).map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        'h-2 w-2 rounded-full transition-all duration-200',
                        index === current ? 'w-4 bg-white' : 'bg-white/50'
                      )}
                    />
                  ))}
                </div>
              </Carousel>
            ) : (
              // Single photo - no carousel
              <motion.div
                layoutId={moment.photos[0].id}
                className="relative h-full w-full cursor-grab overflow-hidden rounded-lg active:cursor-grabbing"
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
                  className="h-full w-full object-cover"
                  priority
                  unoptimized
                />
              </motion.div>
            )}
          </div>
          <div className="attributes flex-1">
            <div className="@container flex flex-col gap-4 pt-16 pr-4 pb-4 h-full">
              <div className="face relative">
                <Badge className="absolute top-1 left-1 bg-white/50">
                  Face
                </Badge>
                <img
                  alt="face"
                  src={
                    merged?.face
                      ? assetsMap?.get(merged.face)?.url || '/face.png'
                      : '/face.png'
                  }
                  className="h-full w-full object-cover"
                />
              </div>
              {nonFaceMixins.length > 0 && (
                <div className="mixins grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-white/10 @sm:grid-cols-3 @lg:grid-cols-4">
                  {nonFaceMixins.map(([type, assetId]) => {
                    const assetType = assetTypes.find(t => t.type === type)
                    const displayName = assetType?.name || type
                    const asset =
                      assetId && assetsMap ? assetsMap.get(assetId) : null
                    return (
                      <div
                        key={type}
                        className="mixin-item relative flex h-20 items-center justify-center overflow-hidden bg-black/75">
                        <Badge className="absolute top-1 left-1 z-10 bg-white/50">
                          {displayName}
                        </Badge>
                        {asset?.url ? (
                          <img
                            alt={asset.name || displayName}
                            src={asset.url}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Badge className="bg-black/50 text-white">
                            {asset?.name || displayName}
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                  {emptyAssets.map((_, index) => (
                    <div
                      key={`empty-${index}`}
                      className="mixin-item h-20 bg-black/75"
                    />
                  ))}
                </div>
              )}
              <div className="rounded border bg-linear-to-t from-black/80 to-black/40 p-4">
                <motion.div
                  className="max-h-24 overflow-clip"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}>
                  <p className="text-sm text-white">{moment.prompt}</p>
                </motion.div>
              </div>
              <div className="flex-1"></div>
              <div className="flex flex-0 items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      size="icon"
                      className="icon-button delete-button cursor-pointer"
                      variant="destructive"
                      disabled={deleteMoment.isPending}>
                      {deleteMoment.isPending ? <Loader2 className="animate-spin" /> : <Trash />}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto min-w-100 flex items-center justify-between p-3 z-101 rounded-4xl bg-black"
                    side="top" align="start">
                    <p className="mb text-sm">Delete this moment and all the photos?</p>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={deleteMoment.isPending}
                      onClick={() => deleteMoment.mutate(moment.id, { onSuccess: onClose })}>
                      {deleteMoment.isPending ? 'Deleting...' : 'Confirm'}
                    </Button>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {/**@container */}
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
