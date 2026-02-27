'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useProfile } from '@/hooks/use-profile'
import { Sparkle } from 'lucide-react'

export interface CreditsProps extends React.HTMLAttributes<HTMLDivElement> {
  prefix?: string
}

export function Credits({ prefix = 'CREDITS', className, ...props }: CreditsProps) {
  const { data: profile, isLoading } = useProfile()

  if (isLoading || profile == null) return null

  return (
    <Link href="/credits" className="w-full">
      <div
        className={cn(
          'flex h-9 items-center justify-between rounded-full px-3',
          'text-xs tabular-nums',
          'cursor-pointer w-full',
          'hover:bg-accent transition-colors',
          className
        )}
        {...props}>
        <div>{prefix}</div>
        <div className="flex items-center gap-1">
          <Sparkle className="size-4 text-yellow-400" />
          {profile.credits}
        </div>
      </div>
    </Link>
  )
}
