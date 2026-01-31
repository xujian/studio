'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Producer } from '@/components/producer'
import { Button } from '@/components/ui/button'
import type { PromptInput } from '@/lib/validations'
import { useGenerateMutation } from '@/hooks/use-generations'
import { useMoments } from '@/hooks/use-moments'

export default function StudioPage() {
  const [currentImage, setCurrentImage] = useState<{
    url: string
    prompt: string
  } | null>(null)
  const [currentPrompt, setCurrentPrompt] = useState('')

  const generateMutation = useGenerateMutation()
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useMoments()

  const handleSubmit = async (data: PromptInput) => {
    setCurrentPrompt(data.prompt)
    try {
      const result = await generateMutation.mutateAsync(data.prompt)
      setCurrentImage({
        url: result.url,
        prompt: result.prompt
      })
    } catch {
      // Error handled by mutation
    }
  }

  const handleRegenerate = () => {
    if (currentPrompt) {
      handleSubmit({ prompt: currentPrompt })
    }
  }

  // Flatten all pages into single array
  const allMoments = data?.pages.flatMap(page => page.moments) || []

  return (
    <section className="flex w-full flex-col items-start justify-center px-16 pb-52">
      <h1 className="mb-6 text-2xl font-semibold">Moments</h1>
      {isLoading && (
        <div className="text-muted-foreground">Loading moments...</div>
      )}
      {error && (
        <div className="text-destructive">
          Failed to load moments: {error.message}
        </div>
      )}
      {allMoments.length === 0 && !isLoading && !error && (
        <div className="text-muted-foreground">No moments yet</div>
      )}
      <div
        className="grid w-full animate-float-up grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-5"
        style={{ animationDelay: '0.1s' }}>
        {allMoments.map(moment =>
          moment.photos.map(photo => (
            <div
              className="relative aspect-9/16 w-full overflow-hidden rounded bg-muted"
              key={photo.id}
              title={moment.prompt}>
              <Image
                className="object-cover"
                src={photo.url}
                alt={moment.prompt}
                fill
                sizes="(min-width: 1280px) 16vw, (min-width: 768px) 25vw, 50vw"
                loading="lazy"
                unoptimized
              />
            </div>
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
      </div>

      <Producer
        onSubmit={handleSubmit}
        isLoading={generateMutation.isPending}
        defaultValue={currentPrompt}
      />
    </section>
  )
}
