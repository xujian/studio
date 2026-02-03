'use client'

import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { Asset } from '@/lib/types'

interface FacePickerProps {
  faces: Asset[]
  onSelect?: (faceId: string) => void
  selected?: string | null
  className?: string
}

export function FacePicker({
  faces,
  onSelect,
  selected,
  className
}: FacePickerProps) {
  return (
    <div className={cn('flex gap-2 overflow-x-auto', className)}>
      {faces.map((face) => (
        <button
          key={face.id}
          onClick={() => onSelect?.(face.id)}
          className={cn(
            'relative h-12 w-12 flex-shrink-0 rounded-full overflow-hidden',
            'border-2 transition-all',
            selected === face.id
              ? 'border-primary scale-110'
              : 'border-transparent hover:border-primary/50'
          )}
        >
          {face.url && (
            <Image
              src={face.url}
              alt={face.name}
              fill
              className="object-cover"
              sizes="48px"
            />
          )}
        </button>
      ))}
    </div>
  )
}
