'use client'

import { useState } from 'react'
import { GenerationCard } from '@/components/generation-card'
import { GenerationModal } from '@/components/generation-modal'
import { useGenerations, useDeleteGeneration } from '@/hooks/use-generations'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles } from 'lucide-react'
import type { Generation } from '@/lib/types'

export const GalleryGrid = () => {
  const { data: generations, isLoading } = useGenerations()
  const deleteMutation = useDeleteGeneration()
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null)

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square" />
        ))}
      </div>
    )
  }

  if (!generations || generations.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No generations yet</p>
          <Button asChild className="mt-4">
            <a href="/studio">
              <Sparkles className="mr-2 h-4 w-4" />
              Go to Studio
            </a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {generations.map((generation) => (
          <GenerationCard
            key={generation.id}
            generation={generation}
            onClick={() => setSelectedGeneration(generation)}
            onDelete={deleteMutation.mutate}
          />
        ))}
      </div>

      <GenerationModal
        generation={selectedGeneration}
        open={!!selectedGeneration}
        onOpenChange={(open) => !open && setSelectedGeneration(null)}
        onDelete={deleteMutation.mutate}
      />
    </>
  )
}
