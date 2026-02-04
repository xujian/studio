'use client'

import { useState } from 'react'
import { Producer } from '@/components/producer'
import { Button } from '@/components/ui'
import { useMoments } from '@/hooks/use-moments'
import { MomentView, MomentCard, StaggerGrid, MomentSkeleton } from '@/components/motion-exports'
import type { MomentWithPhotos } from '@/lib/types'
import { LayoutGroup } from 'motion/react'

export default function StudioPage() {
  const [selectedMoment, setSelectedMoment] = useState<{
    moment: MomentWithPhotos
    initialPhotoId: string
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
  const allMoments = data?.pages.flatMap(page => page.moments)
    .filter(m => m.photos.length > 0) || []
  console.log('empty moments', data?.pages.flatMap(page => page.moments).filter(m => m.photos.length == 0))

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
          {allMoments.map(moment => (
            <MomentCard
              key={moment.id}
              moment={moment}
              onPhotoClick={(photo, moment) =>
                setSelectedMoment({ moment, initialPhotoId: photo.id })
              }
            />
          ))}
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

      {selectedMoment && (
        <MomentView
          moment={selectedMoment.moment}
          initialPhotoId={selectedMoment.initialPhotoId}
          onClose={() => setSelectedMoment(null)}
        />
      )}

      <Producer
        onGenerationComplete={handleGenerationComplete}
      />
    </section>
  )
}
