'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Producer } from '@/components/producer'
import { Button } from '@/components/ui/button'
import { useMoments } from '@/hooks/use-moments'
import { MomentView, StaggerGrid, MagneticCard, MomentSkeleton } from '@/components/motion-exports'
import type { Photo, MomentWithPhotos } from '@/lib/types'
import { motion, LayoutGroup } from 'motion/react'

export default function StudioPage() {
  const [selectedPhoto, setSelectedPhoto] = useState<{
    photo: Photo
    prompt: string
  } | null>(null)

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useMoments()

  const handleGenerationComplete = (moment: MomentWithPhotos) => {
    // Optional: Could add UI feedback here (toast, animation, etc.)
    console.log('Generation complete:', moment)
  }

  // Flatten all pages into single array
  const allMoments = data?.pages.flatMap(page => page.moments) || []

  return (
    <section className="flex w-full flex-col items-start justify-center px-16 pb-52">
      <h1 className="mb-6 text-2xl font-semibold">Moments</h1>
      {isLoading && (
        <StaggerGrid className="w-full grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <MomentSkeleton key={i} />
          ))}
        </StaggerGrid>
      )}
      {error && (
        <div className="text-destructive">
          Failed to load moments: {error.message}
        </div>
      )}
      {allMoments.length === 0 && !isLoading && !error && (
        <div className="text-muted-foreground">No moments yet</div>
      )}
      <LayoutGroup>
        <StaggerGrid
          className="w-full grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-5"
        >
          {allMoments.map(moment =>
            moment.photos.map(photo => (
              <MagneticCard key={photo.id}>
                <motion.div
                  layoutId={photo.id}
                  className="relative aspect-9/16 w-full overflow-hidden rounded bg-muted cursor-pointer"
                  onClick={() => setSelectedPhoto({ photo, prompt: moment.prompt })}
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
              </MagneticCard>
            ))
          )}
          {hasNextPage && (
            <div
              className="relative flex aspect-9/16 w-full items-center justify-center rounded bg-muted p-4"
              key="load-more">
              <Button
                className="w-full rounded-full"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                variant="outline">
                {isFetchingNextPage ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </StaggerGrid>
      </LayoutGroup>

      {selectedPhoto && (
        <MomentView
          photo={selectedPhoto.photo}
          prompt={selectedPhoto.prompt}
          onClose={() => setSelectedPhoto(null)}
        />
      )}

      <Producer
        onGenerationComplete={handleGenerationComplete}
      />
    </section>
  )
}
