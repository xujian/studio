'use client'

import * as React from 'react'
import { Button } from '@/components/button'
import { MomentCarousel } from '@/components/moment-carousel'
import type { MomentWithPhotos } from '@/lib/types'
import { cn } from '@/lib/utils'
import { usePublishPost, useUnpublishPost } from '@/hooks/use-posts'
import { Globe, GlobeX, Loader2 } from 'lucide-react'

type MomentCardProps = {
  moment: MomentWithPhotos
}

export function MomentCard({ moment }: MomentCardProps) {
  const [published, setPublished] = React.useState(!!moment.published)
  const publishPost = usePublishPost()
  const unpublishPost = useUnpublishPost()

  const isPending = publishPost.isPending || unpublishPost.isPending

  const togglePublish = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (published) {
      unpublishPost.mutate(moment.id, { onSuccess: () => setPublished(false) })
    } else {
      publishPost.mutate(moment.id, { onSuccess: () => setPublished(true) })
    }
  }

  return (
    <MomentCarousel moment={moment}>
      <Button
        size="xs"
        variant="ghost"
        tooltip="Publish to Community"
        className={cn(
          'absolute top-2 right-2 z-20 rounded-full',
          'bg-black/60 text-white opacity-0 transition-opacity',
          'hover:bg-black/80 hover:text-white group-hover:opacity-100',
          published ? 'bg-black' : 'bg-black/50'
        )}
        disabled={isPending}
        onClick={togglePublish}
        aria-label={published ? 'Unpublish moment' : 'Publish moment'}>
        {isPending
          ? <Loader2 className="size-4 animate-spin" />
          : published
            ? <GlobeX className="size-4" />
            : <Globe className="size-4" />
        }
        {published ? 'Published' : 'Publish'}
      </Button>
    </MomentCarousel>
  )
}
