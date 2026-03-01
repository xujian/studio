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

  if (isLoading || profile == null) return null

  return (
    <Link href="/credits" className="w-full">
      <div
        className={cn(
          'credits flex h-9 items-center justify-between rounded-full gap-4',
          'text-sm tabular-nums',
          'cursor-pointer w-full',
          'hover:bg-accent transition-colors',
          className
        )}
        {...props}>
        <div className="flex items-center gap-1">
          <span className="font-medium">{prefix}</span>
          <Zap className="size-4 text-yellow-400" />
          <span className="number font-bold">{profile.credits}</span>
        </div>
        <div>CREDITS</div>
      </div>
    </Link>
  )
}
