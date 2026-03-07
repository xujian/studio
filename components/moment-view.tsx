'use client'

import Image from 'next/image'
import * as React from 'react'
import { motion } from 'motion/react'
import { Button } from '@/components/button'
import {
  Badge,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from '@/components/ui'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui'
import { useBus } from '@/lib/bus'
import { assetTypes } from '@/lib/constants'
import type { MomentWithPhotos } from '@/lib/types'
import { assetUrl, cn, photoUrl, uploadUrl } from '@/lib/utils'
import { useMixins } from '@/hooks/use-mixins'
import { useDeleteMoment, useDeletePhoto } from '@/hooks/use-moments'
import { useSharePost, useUnsharePost } from '@/hooks/use-posts'
import { DeleteConfirm } from './delete-confirm'
import { MomentInfo } from './moment-info'
import {
  GalleryHorizontal,
  Globe,
  GlobeLock,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Trash
} from 'lucide-react'

export interface MomentViewProps {
  moment: MomentWithPhotos
  initialPhotoId: string
  onClose?: () => void
  onDragStateChange?: (dragging: boolean) => void
  readOnly?: boolean
  author?: { id: string; name: string | null; avatar: string | null }
}

export function MomentView({
  moment,
  initialPhotoId,
  onClose,
  onDragStateChange,
  readOnly = false,
  author
}: MomentViewProps) {
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const [shared, setShared] = React.useState(false)
  const $bus = useBus()
  const deleteMoment = useDeleteMoment()
  const deletePhoto = useDeletePhoto()
  const sharePost = useSharePost()
  const unsharePost = useUnsharePost()

  // Check if this moment is shared (only for owner view)
  React.useEffect(() => {
    if (readOnly) return
    ;(async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const sb = createClient()
      const { data } = await sb
        .from('posts')
        .select('id')
        .eq('moment_id', moment.id)
        .maybeSingle()
      setShared(!!data)
    })()
  }, [moment.id, readOnly])

  // Find initial photo index
  const initialIndex = moment.photos.findIndex(p => p.id === initialPhotoId)

  const hasMultiplePhotos = moment.photos.length > 1
  const clampedCurrent = Math.min(current, moment.photos.length - 1)
  const currentPhoto = moment.photos[clampedCurrent]
  const merged = {
    ...moment.mixins,
    ...currentPhoto?.mixins
  }
  // Fetch mixins and assets for current photo
  const { data: assetsMap } = useMixins(merged)
  const nonFaceMixins = Object.entries(merged).filter(([key]) => key !== 'face')
  const emptyAssets = Array(4 - (nonFaceMixins.length % 4)).fill(null)

  // Set up carousel API and re-sync when photos change
  React.useEffect(() => {
    if (!api) return
    setCurrent(api.selectedScrollSnap())
    const onSelect = () => setCurrent(api.selectedScrollSnap())
    api.on('select', onSelect)
    return () => {
      api.off('select', onSelect)
    }
  }, [api, moment.photos.length])
  // Scroll to initial photo
  React.useEffect(() => {
    if (api && initialIndex >= 0) {
      api.scrollTo(initialIndex, true) // true = instant, no animation
    }
  }, [api, initialIndex])

  const redo = () => {
    $bus.emit('moment:resume', {
      momentId: moment.id,
      prompt: currentPhoto?.prompt || moment.prompt,
      mixins: { ...moment.mixins, ...currentPhoto?.mixins },
      reference: moment.reference || undefined
    })
    onClose?.()
  }

  const dragProps = onClose
    ? {
        drag: 'y' as const,
        dragConstraints: { top: 0, bottom: 300 },
        dragElastic: 0.2,
        onDragStart: () => onDragStateChange?.(true),
        onDragEnd: (
          _e: MouseEvent | TouchEvent | PointerEvent,
          info: { offset: { y: number } }
        ) => {
          onDragStateChange?.(false)
          if (info.offset.y > 150) onClose()
        },
        className:
          'relative h-full w-full cursor-grab overflow-hidden rounded-2xl active:cursor-grabbing'
      }
    : {
        className: 'relative h-full w-full overflow-hidden rounded-2xl'
      }

  return (
    <div className="relative z-10 flex h-full w-full justify-between">
      <div className="flex-1">
        {readOnly && author ? (
          <div className="flex h-full w-full flex-col gap-3 p-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                {author.avatar && (
                  <AvatarImage src={author.avatar} alt={author.name || ''} />
                )}
                <AvatarFallback>{(author.name || '?')[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-white">
                  {author.name || 'Anonymous'}
                </p>
              </div>
            </div>
            {moment.title && (
              <h1 className="text-3xl font-bold text-white">{moment.title}</h1>
            )}
            {moment.created_at && (
              <p className="text-sm text-gray-400">
                {new Date(moment.created_at).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            )}
          </div>
        ) : (
          <MomentInfo {...moment} />
        )}
      </div>
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
                  <motion.div layoutId={photo.id} {...dragProps}>
                    <Image
                      src={photoUrl(moment.user_id, moment.id, photo.id)}
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
              {Array.from({ length: moment.photos.length }).map((_, index) => (
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
          <motion.div layoutId={moment.photos[0].id} {...dragProps}>
            <Image
              src={photoUrl(moment.user_id, moment.id, moment.photos[0].id)}
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
        <div className="@container flex h-full flex-col gap-4 pt-16 pr-4 pb-4">
          <div className="gap flex items-start justify-start">
            <div className="face relative">
              <Badge className="absolute top-1 left-1 bg-black/80 text-foreground">
                Face
              </Badge>
              <img
                alt="face"
                src={
                  merged?.face
                    ? assetUrl(assetsMap?.get(merged.face)?.path!) ||
                      '/face.png'
                    : '/face.png'
                }
                className="h-full w-full object-cover"
              />
            </div>
            {moment.reference && (
              <div className="reference relative overflow-hidden rounded-lg border">
                <Badge className="absolute top-1 left-1 bg-black/80 text-foreground">
                  Reference image
                </Badge>
                <img
                  alt="reference"
                  src={uploadUrl(moment.user_id, moment.reference)}
                  className="max-h-50 max-w-50 object-cover"
                />
              </div>
            )}
          </div>
          {nonFaceMixins.length > 0 && (
            <div className="mixins grid grid-cols-2 gap-px overflow-hidden rounded border bg-white/10 @sm:grid-cols-3 @lg:grid-cols-4">
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
                    {asset?.path ? (
                      <img
                        alt={asset.name || displayName}
                        src={asset.path}
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
          <div className="relative rounded border bg-linear-to-t from-black/80 to-black/40 p-4">
            <Badge className="absolute -top-2 left-1 bg-black/80 text-foreground">
              Prompt
            </Badge>
            <motion.div
              className="max-h-24 overflow-clip"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}>
              <p className="text-xs text-white">
                {currentPhoto.prompt || moment.prompt || '(EMPTY)'}
              </p>
            </motion.div>
          </div>
          {!readOnly && (
            <>
              <div className="flex flex-0 items-center gap-2">
                <Button
                  size="icon"
                  tooltip="load setting and redo this photo"
                  className="cursor-pointer bg-primary text-primary-foreground"
                  variant="ghost"
                  onClick={redo}>
                  <RotateCcw />
                </Button>
                <Button
                  size="icon"
                  tooltip={
                    shared ? 'unshare from community' : 'share to community'
                  }
                  className="cursor-pointer bg-primary text-primary-foreground"
                  variant="ghost"
                  disabled={sharePost.isPending || unsharePost.isPending}
                  onClick={() => {
                    if (shared) {
                      unsharePost.mutate(moment.id, {
                        onSuccess: () => setShared(false)
                      })
                    } else {
                      sharePost.mutate(moment.id, {
                        onSuccess: () => setShared(true)
                      })
                    }
                  }}>
                  {sharePost.isPending || unsharePost.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : shared ? (
                    <Globe />
                  ) : (
                    <GlobeLock />
                  )}
                </Button>
              </div>
              <div className="flex-1"></div>
              <div className="flex flex-0 items-center gap-2">
                {hasMultiplePhotos && currentPhoto && (
                  <DeleteConfirm
                    icon={
                      <>
                        <Trash />
                        <ImageIcon />
                      </>
                    }
                    message="Delete this photo?"
                    isPending={deletePhoto.isPending}
                    action={() =>
                      deletePhoto.mutate({
                        userId: moment.user_id,
                        momentId: moment.id,
                        photoId: currentPhoto.id
                      })
                    }
                  />
                )}
                <DeleteConfirm
                  icon={
                    <>
                      <Trash />
                      <GalleryHorizontal />
                    </>
                  }
                  message="Delete this moment and all the photos?"
                  isPending={deleteMoment.isPending}
                  className="delete-button"
                  action={() =>
                    deleteMoment.mutate(moment.id, {
                      onSuccess: () => onClose?.()
                    })
                  }
                />
              </div>
            </>
          )}
          {readOnly && <div className="flex-1"></div>}
        </div>
        {/**@container */}
      </div>
    </div>
  )
}
