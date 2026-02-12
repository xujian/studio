'use client'

import * as React from 'react'
import Image from 'next/image'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import { Size } from '@/lib/types'

const IMAGE_EXT_RE = /\.(jpg|jpeg|png|gif|webp|svg|avif|bmp)(\?.*)?$/i

function isImageUrl(value: string): boolean {
  return IMAGE_EXT_RE.test(value)
}

interface PeekableProps {
  children: React.ReactNode
  content: React.ReactNode
  title?: string
  description?: string
  size?: Size
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  className?: string
}

const sizes = {
  xs: 'max-w-24 max-h-24',
  sm: 'max-w-32 max-h-32',
  md: 'max-w-80 max-h-80',
  lg: 'max-w-100 max-h-100',
  xl: 'max-w-150 max-h-150',
}

export function Peekable({
  children,
  content,
  title,
  size="md",
  description,
  side = 'top',
  align = 'start',
  className,
}: PeekableProps) {
  const preview = React.useMemo(() => {
    if (typeof content !== 'string') return content
    if (isImageUrl(content)) {
      return (
        <div className="peekable-preview flex flex-col rounded bg-black overflow-hidden">
          <Image
            src={content}
            alt="Preview"
            width={200}
            height={200}
            className={cn('rounded w-full h-full', sizes[size])}
            unoptimized
          />
          {title && <h4 className="truncate p-2 text-sm font-bold text-white">{title}</h4>}
          {description && <p className="truncate p-2 text-xs">{description}</p>}
        </div>
      )
    }
    return (
      <div className="p-4 bg-black text-neutral-100">
        {title && <h4 className="truncate mb-2 text-[12px] font-bold leading-4">{title}</h4>}
        <p className="text-xs text-neutral-500 max-h-40 overflow-hidden">{content}</p>
      </div>
    )
  }, [content])

  return (
    <Tooltip delayDuration={800}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        align={align}
        sideOffset={0}
        className={cn(
          'max-w-xs rounded overflow-hidden border p-0 bg-black shadow-lg',
          className,
        )}>
        {preview}
      </TooltipContent>
    </Tooltip>
  )
}
