'use client'

import { Button, type ButtonProps } from '@/components/button'
import { useProfile } from '@/hooks/use-profile'
import { cn } from '@/lib/utils'
import { Zap } from 'lucide-react'

type CreditButtonProps = ButtonProps & {
  cost: number
}

function CreditButton({
  cost,
  children,
  disabled,
  tooltip,
  className,
  ...props
}: CreditButtonProps) {
  const { data: profile, isLoading } = useProfile()

  const hasEnough = isLoading || profile == null || profile.credits >= cost
  const shortfall = profile ? cost - profile.credits : 0

  const resolvedTooltip = !hasEnough
    ? `Need ${shortfall} more credit${shortfall !== 1 ? 's' : ''} (you have ${profile!.credits})`
    : tooltip

  return (
    <Button
      {...props}
      className={cn(
        'flex items-center justify-between gap-1',
        'bg-positive/90 border-positive text-positive-foreground hover:bg-positive/90', className)}
      disabled={disabled || !hasEnough}
      tooltip={resolvedTooltip}>
      {children}
      <span className="flex items-center gap-0.5 opacity-70">
        <Zap className="bg-write fill-white size-3" />
        <span className="tabular-nums">{cost}</span>
      </span>
    </Button>
  )
}

export { CreditButton, type CreditButtonProps }
