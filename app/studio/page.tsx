'use client'

import { useRouter } from 'next/navigation'
import { Suspense, useState, useEffect } from 'react'
import { LayoutGroup } from 'motion/react'
import { MomentCard } from '@/components/moment-card'
import { MomentSkeleton } from '@/components/moment-skeleton'
import { Producer } from '@/components/producer'
import { AssetsManager } from '@/components/assets-manager'
import { StaggerGrid } from '@/components/stagger-grid'
import { Button } from '@/components/ui'
import type { AssetType, MomentWithPhotos } from '@/lib/types'
import { useMoments } from '@/hooks/use-moments'
import { useBus } from '@/lib/bus'

export default function StudioPage() {
  const router = useRouter()
  const [activeAssets, setActiveAssets] = useState<AssetType | null>(null)
  const $bus = useBus()

  useEffect(() => {
    $bus.on('assets:open', ({ type }) => setActiveAssets(type))
  }, [])

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useMoments()

  const handleGenerationComplete = (moment: MomentWithPhotos) => {
    console.log('Generation complete:', moment)
  }

  // Flatten all pages into single array
  const allMoments =
    data?.pages
      .flatMap(page => page.moments)
      .filter(m => m.photos.length > 0) || []

  return (
    <>
      <section className={activeAssets ? 'hidden' : 'moments flex w-full flex-col items-start justify-center px-16 pb-52'}>
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
                  router.push(`/moments/${moment.id}?photo=${photo.id}`)
                }
              />
            ))}
            {hasNextPage && (
              <div
                className="relative flex aspect-9/16 w-full items-center justify-center rounded-2xl bg-muted p-4"
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
      </section>
      {activeAssets && (
        <section className="flex w-full flex-col items-start justify-center px-16 pb-52">
          <AssetsManager type={activeAssets} onClose={() => {
            setActiveAssets(null)
            $bus.emit('assets:close', undefined)
          }} />
        </section>
      )}
      <Suspense>
        <Producer onGenerationComplete={handleGenerationComplete} />
      </Suspense>
    </>
  )
}
