'use client'

import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'
import { Button } from '../button'

type HintProps = {
  children: React.ReactNode
  variant?: 'tooltip' | 'inline'
  className?: string
}

export const Hint = ({
  children,
  variant = 'inline',
  className
}: HintProps) => {
  if (variant === 'tooltip') {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="icon-sm"
            variant="outline"
            aria-label="More information"
            className={cn(
              'inline-flex items-center justify-center',
              'text-muted-foreground/60 hover:text-foreground',
              'cursor-pointer transition-colors',
              className
            )}>
            <Info className="h-8 w-8" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          sideOffset={6}
          className="w-auto max-w-56 p-2 text-xs">
          {children}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <p
      className={cn(
        'flex items-start gap-1.5',
        'mt-1.5 text-xs leading-snug text-muted-foreground/70',
        className
      )}>
      <Info className="mt-0.5 h-3 w-3 shrink-0 opacity-70" />
      {children}
    </p>
  )
}
