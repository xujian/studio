'use client'

import Image from 'next/image'
import * as React from 'react'
import { motion } from 'motion/react'
import { Button } from '@/components/button'
import {
  Badge,
} from '@/components/ui'
import { Avatar } from '@/components/avatar'
import { MomentCarousel } from '@/components/moment-carousel'
import { useBus } from '@/lib/bus'
import { assets } from '@/lib/assets-config'
import type { MomentWithPhotos, Profile } from '@/lib/types'
import { assetUrl, cn, photoUrl, uploadUrl } from '@/lib/utils'
import { useMixins } from '@/hooks/use-mixins'
import { useDeleteMoment, useDeletePhoto } from '@/hooks/use-moments'
import { usePublishPost, useUnpublishPost } from '@/hooks/use-posts'
import { ConfirmButton } from './confirm-button'
import { MomentInfo } from './moment-info'
import {
  Download,
  GalleryHorizontal,
  Globe,
  GlobeLock,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Trash
} from 'lucide-react'
import { MomentPrompt } from './moment-prompt'

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
  const [photos, setPhotos] = React.useState(moment.photos)
  const [currentPhoto, setCurrentPhoto] = React.useState(
    () => photos.find(p => p.id === initialPhotoId) ?? photos[0]
  )
  const [published, setPublished] = React.useState(!!moment.published)
  const $bus = useBus()
  const deleteMoment = useDeleteMoment()
  const deletePhoto = useDeletePhoto()
  const publishPost = usePublishPost()
  const unpublishPost = useUnpublishPost()

  const hasMultiplePhotos = photos.length > 1
  const merged = {
    ...moment.mixins,
    ...currentPhoto?.mixins
  }
  // Fetch mixins and assets for current photo
  const { data: assetsMap } = useMixins(merged)
  const nonFaceMixins = Object.entries(merged).filter(([key]) => key !== 'face')
  const emptyAssets = Array(4 - (nonFaceMixins.length % 4)).fill(null)

  const download = async () => {
    const url = photoUrl(moment.user, moment.id, currentPhoto.id)
    const res = await fetch(url)
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = `${currentPhoto.id}.jpg`
    a.click()
    URL.revokeObjectURL(objectUrl)
  }

  const redo = () => {
    $bus.emit('moment:resume', {
      momentId: moment.id,
      prompt: currentPhoto?.prompt || moment.prompt,
      mixins: { ...moment.mixins, ...currentPhoto?.mixins },
      reference: moment.reference || undefined
    })
    onClose?.()
  }

  return (
    <div className="relative z-10 flex h-full w-full justify-between">
      <div className="flex-1">
        {readOnly && author ? (
          <div className="flex h-full w-full flex-col gap-3 p-4">
            <div className="flex items-center gap-3">
              <Avatar user={author as Profile} className="size-10" />
              <div>
                <p className="font-semibold text-foreground">
                  {author.name || 'Anonymous'}
                </p>
              </div>
            </div>
            {moment.title && (
              <h1 className="text-3xl font-bold text-foreground">{moment.title}</h1>
            )}
            {moment.created && (
              <p className="text-sm text-muted-foreground">
                {new Date(moment.created).toLocaleString('en-US', {
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
      <div className="aspect-9/16 h-full p-4">
        <MomentCarousel
          moment={{ ...moment, photos }}
          photo={initialPhotoId}
          onChange={(photo) => setCurrentPhoto(photo)}
          onClose={onClose}
          sizes="(min-width: 1280px) 400px, 50vw"
        />
      </div>
      <div className="attributes flex-1">
        <div className="@container flex h-full flex-col gap-4 pt-16 pr-4 pb-4">
          <div className="min-h-20 gap flex items-start justify-start">
            <div className="face relative">
              <Badge className="absolute top-1 left-1 bg-background/80 text-foreground">
                Face
              </Badge>
              <Image
                alt="face"
                src={
                  merged?.face
                    ? assetUrl(assetsMap?.get(merged.face as string)?.path ?? '') ||
                      '/icons/face.png'
                    : '/icons/face.png'
                }
                width={80}
                height={80}
                className="w-full h-full object-cover object-top"
              />
            </div>
            {moment.reference && (
              <div className="reference relative overflow-hidden rounded-lg border border-border">
                <Badge className="absolute top-1 left-1 bg-background/80 text-foreground">
                  Reference image
                </Badge>
                <Image
                  alt="reference"
                  src={uploadUrl(moment.user, moment.reference)}
                  width={180}
                  height={320}
                  className="max-h-50 max-w-50 object-cover"
                  sizes="200px"
                />
              </div>
            )}
          </div>
          {nonFaceMixins.length > 0 && (
            <div className="mixins max-w-120 grid grid-cols-2 gap-px overflow-hidden rounded border bg-foreground/10 @sm:grid-cols-3 @lg:grid-cols-4">
              {nonFaceMixins.map(([type, assetId]) => {
                const assetType = assets.find(t => t.id === type)
                const displayName = assetType?.id || type
                const asset =
                  assetId && assetsMap ? assetsMap.get(assetId as string) : null
                return (
                  <div
                    key={type}
                    className="mixin-item relative flex h-30 items-center justify-center rounded overflow-hidden bg-background/75">
                    <Badge className="absolute top-1 left-1 z-10 bg-background/50  text-foreground">
                      {displayName}
                    </Badge>
                    {asset?.path
                      ? (<Image
                            alt={asset.name || displayName}
                            src={assetUrl(asset.path)}
                            fill
                            className="object-cover"
                            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
                          />)
                      : (<p className="text-xs">
                            {asset?.name || displayName}
                          </p>)}
                  </div>
                )
              })}
              {emptyAssets.map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="mixin-item h-30"
                />
              ))}
            </div>
          )}
          <MomentPrompt value={currentPhoto?.prompt || moment?.prompt} />
          {!readOnly && (
            <>
              <div className="flex flex-0 items-center gap-2">
                <Button
                  size="icon-lg"
                  tooltip="load setting and redo this photo"
                  className="cursor-pointer bg-primary text-primary-foreground"
                  variant="ghost"
                  onClick={redo}>
                  <RotateCcw />
                </Button>
                <Button
                  size="icon-lg"
                  tooltip="download original image"
                  className="cursor-pointer bg-primary text-primary-foreground"
                  variant="ghost"
                  onClick={download}>
                  <Download />
                </Button>
                <Button
                  size="icon-lg"
                  tooltip={
                    published ? 'unpublish from community' : 'publish to community'
                  }
                  className="cursor-pointer bg-primary text-primary-foreground"
                  variant="ghost"
                  disabled={publishPost.isPending || unpublishPost.isPending}
                  onClick={() => {
                    if (published) {
                      unpublishPost.mutate(moment.id, {
                        onSuccess: () => setPublished(false)
                      })
                    } else {
                      publishPost.mutate(moment.id, {
                        onSuccess: () => setPublished(true)
                      })
                    }
                  }}>
                  {publishPost.isPending || unpublishPost.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : published ? (
                    <Globe />
                  ) : (
                    <GlobeLock />
                  )}
                </Button>
              </div>
              <div className="flex-1"></div>
              <div className="flex flex-0 items-center gap-2">
                {hasMultiplePhotos && currentPhoto && (
                  <ConfirmButton
                    message="Delete this photo?"
                    isPending={deletePhoto.isPending}
                    action={() =>
                      deletePhoto.mutate(
                        {
                          userId: moment.user,
                          momentId: moment.id,
                          photoId: currentPhoto.id
                        },
                        {
                          onSuccess: () =>
                            setPhotos(prev =>
                              prev.filter(p => p.id !== currentPhoto.id)
                            )
                        }
                      )
                    }>
                      <div className="flex">
                        <Trash />
                        <ImageIcon />
                      </div>
                  </ConfirmButton>
                )}
                <ConfirmButton
                  message="Delete this moment and all the photos?"
                  isPending={deleteMoment.isPending}
                  className="delete-button"
                  action={(e) => {
                    e.stopPropagation()
                    deleteMoment.mutate(moment.id, {
                      onSuccess: () => onClose?.()
                    })
                  }}>
                    <div className="flex">
                      <Trash />
                      <GalleryHorizontal />
                    </div>
                  </ConfirmButton>
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
