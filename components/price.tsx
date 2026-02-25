import { cn } from '@/lib/utils'
import { Sparkle } from 'lucide-react'

interface PriceProps {
  value: number
  /**
   * badge  — small pill, e.g. on a card corner
   * button — full-width button-like row, e.g. inside a modal
   */
  variant?: 'badge' | 'button'
  className?: string
}

export function Price({ value, variant = 'badge', className }: PriceProps) {
  if (variant === 'button') {
    return (
      <span
        className={cn(
          'flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm font-medium',
          'border-border bg-secondary text-secondary-foreground',
          className
        )}>
        <span className="text-muted-foreground text-xs">PRICE</span>
        <span className="flex items-center gap-1">
          <Sparkle className="size-3 text-yellow-400" />
          {value}
        </span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        'border-border bg-secondary text-secondary-foreground',
        className
      )}>
      <Sparkle className="size-3" />
      {value}
    </span>
  )
}
