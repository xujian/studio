'use client'

import { Suspense, useState, useEffect } from 'react'
import { LayoutGroup } from 'motion/react'
import { MomentCard } from '@/components/moment-card'
import { MomentSkeleton } from '@/components/moment-skeleton'
import { Producer } from '@/components/producer'
import { AssetsManager } from '@/components/assets-manager'
import { StaggerGrid } from '@/components/stagger-grid'
import { Button } from '@/components/ui'
import { StudioWelcome } from '@/components/studio-welcome'
import { StudioCoachMarks } from '@/components/studio-coach-marks'
import type { AssetType, MomentWithPhotos } from '@/lib/types'
import { useMoments } from '@/hooks/use-moments'
import { useBus } from '@/lib/bus'
import { ArrowRight } from 'lucide-react'

export default function StudioPage() {
  const [activeAssets, setActiveAssets] = useState<AssetType | null>(null)
  const [onboardingStep, setOnboardingStep] = useState<0 | 1 | 2 | 3>(() => {
    if (typeof window === 'undefined') return 0
    return localStorage.getItem('kanojo:onboarded') ? 0 : 1
  })
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

  const handleFacePickerOpen = () => {
    if (onboardingStep === 1) setOnboardingStep(2)
  }

  const handleExpandedChange = (expanded: boolean) => {
    if (onboardingStep === 2 && expanded) setOnboardingStep(3)
  }

  const handlePromptChange = () => {
    if (onboardingStep === 3) {
      localStorage.setItem('kanojo:onboarded', '1')
      setOnboardingStep(0)
    }
  }

  const handleGenerationComplete = (moment: MomentWithPhotos) => {
    localStorage.setItem('kanojo:onboarded', '1')
    setOnboardingStep(0)
  }

  // Flatten all pages into single array
  const allMoments =
    data?.pages
      .flatMap(page => page.moments)
      .filter(m => m.photos.length > 0) || []
  
  return (
    <>
      <section className={activeAssets ? 'hidden' : 'moments flex w-full flex-col items-start justify-center px-4 pb-52 md:px-8 lg:px-16'}>
        <h1>Moments</h1>
        {isLoading && (
          <StaggerGrid className="w-full grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <MomentSkeleton key={i} />
            ))}
          </StaggerGrid>
        )}
        {error && (
          <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-6">
            <p className="text-sm text-destructive">Failed to load moments: {error.message}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Try again
            </Button>
          </div>
        )}
        {allMoments.length === 0 && !isLoading && !error && <StudioWelcome />}
        <LayoutGroup>
          <StaggerGrid className="w-full grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
            {allMoments.map(moment => (
              <MomentCard key={moment.id} moment={moment} />
            ))}
            {hasNextPage && (
              <div
                className="relative flex aspect-9/16 w-full items-center justify-center rounded-3xl p-0"
                key="load-more">
                <Button
                  className="button w-full! h-full! rounded-2xl!"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  variant="outline">
                  {isFetchingNextPage ? 'Loading...' : 'Load More'}
                  <ArrowRight className="" />
                </Button>
              </div>
            )}
          </StaggerGrid>
        </LayoutGroup>
      </section>
      {activeAssets && (
        <section className="flex w-full flex-col items-start justify-center px-4 pb-52 md:px-8 lg:px-16">
          <AssetsManager type={activeAssets} onClose={() => {
            setActiveAssets(null)
            $bus.emit('assets:close', undefined)
          }} />
        </section>
      )}
      <Suspense>
        <Producer
          onFacePickerOpen={handleFacePickerOpen}
          onExpandedChange={handleExpandedChange}
          onPromptChange={handlePromptChange}
          onGenerationComplete={handleGenerationComplete}
        />
      </Suspense>
      <StudioCoachMarks step={onboardingStep} />
    </>
  )
}
