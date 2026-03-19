'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useProfile } from '@/hooks/use-profile'
import { Zap } from 'lucide-react'

export interface CreditsProps extends React.HTMLAttributes<HTMLDivElement> {
  prefix?: string
}

export function Credits({ prefix = '', className, ...props }: CreditsProps) {
  const { data: profile, isLoading } = useProfile()

  if (profile == null) return null

  return (
    <Link href="/credits" className="w-full">
      <div
        className={cn(
          'credits flex h-8 items-center justify-between gap-4 px-1',
          'text-sm tabular-nums',
          'cursor-pointer w-full',
          'rounded-lg hover:bg-accent transition-colors',
          className
        )}
        {...props}>
        {isLoading
          ? (<div className="h-4 w-12 rounded bg-muted animate-pulse" />)
          : (<>
              <div className="flex items-center gap-1">
                <span className="font-medium">{prefix}</span>
                <Zap className="size-4 text-yellow-400" />
                <span className="text-xs number font-bold">{profile.credits}</span>
              </div>
              <div className="text-xs">CREDITS</div>
            </>)}
      </div>
    </Link>
  )
}
