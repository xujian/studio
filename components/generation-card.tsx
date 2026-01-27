'use client'

import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Generation } from '@/lib/types'

type GenerationCardProps = {
  generation: Generation
  onClick: () => void
  onDelete: (id: string) => void
}

export const GenerationCard = ({
  generation,
  onClick,
  onDelete,
}: GenerationCardProps) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this generation?')) {
      onDelete(generation.id)
    }
  }

  if (!generation.url) return null

  return (
    <Card
      className={cn(
        "group relative cursor-pointer overflow-hidden",
        "float-panel",
        "border-border/20"
      )}
      onClick={onClick}
    >
      <div className="aspect-square relative">
        <Image
          src={generation.url}
          alt={generation.prompt}
          fill
          className="object-cover"
        />

        {/* Glass overlay on hover with dramatic blur */}
        <div className={cn(
          "absolute inset-0",
          "glass backdrop-blur-3xl",
          "opacity-0 group-hover:opacity-100",
          "transition-all duration-500"
        )}>
          <div className="flex h-full flex-col justify-between p-4">
            <Button
              size="icon"
              variant="destructive"
              className="ml-auto glow-primary-hover"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <div className="text-white">
              <p className="line-clamp-2 text-sm font-medium vibrancy-text">
                {generation.prompt}
              </p>
              <p className="mt-1 text-xs opacity-80">
                {formatDistanceToNow(new Date(generation.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
