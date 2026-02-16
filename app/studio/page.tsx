'use client'

import { useState } from 'react'
import { LayoutGroup } from 'motion/react'
import { MomentView } from '@/components/moment-view'
import { MomentCard } from '@/components/moment-card'
import { StaggerGrid } from '@/components/stagger-grid'
import { MomentSkeleton } from '@/components/moment-skeleton'
import { Producer } from '@/components/producer'
import { Button } from '@/components/ui'
import type { MomentWithPhotos } from '@/lib/types'
import { useMoments } from '@/hooks/use-moments'

export default function StudioPage() {
  const [selectedMomentId, setSelectedMomentId] = useState<{
    momentId: string
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
  const allMoments =
    data?.pages
      .flatMap(page => page.moments)
      .filter(m => m.photos.length > 0) || []

  // Derive selected moment from live query data so it stays in sync after mutations
  const selectedMoment = selectedMomentId
    ? allMoments.find(m => m.id === selectedMomentId.momentId)
    : null

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
        <StaggerGrid className="w-full grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-5">
          {allMoments.map(moment => (
            <MomentCard
              key={moment.id}
              moment={moment}
              onPhotoClick={(photo, moment) =>
                setSelectedMomentId({ momentId: moment.id, initialPhotoId: photo.id })
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
      {selectedMoment && selectedMomentId && (
        <MomentView
          moment={selectedMoment}
          initialPhotoId={selectedMomentId.initialPhotoId}
          onClose={() => setSelectedMomentId(null)}
        />
      )}
      <Producer onGenerationComplete={handleGenerationComplete} />
    </section>
  )
}
