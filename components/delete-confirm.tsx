import * as React from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui'
import { Button } from '@/components/button'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeleteConfirmProps {
  icon: React.ReactNode
  message: string
  isPending?: boolean
  action: () => void
  confirmLabel?: string
  pendingLabel?: string
  variant?: 'destructive' | 'default' | 'outline' | 'ghost'
  className?: string
}

export function DeleteConfirm({
  icon,
  message,
  isPending = false,
  action,
  confirmLabel = 'Confirm',
  pendingLabel = 'Deleting...',
  variant = 'destructive',
  className,
}: DeleteConfirmProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          className={cn('cursor-pointer', className)}
          variant={variant}
          disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : icon}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="z-101 flex w-auto min-w-80 items-center justify-between rounded-4xl bg-black p-3"
        side="top"
        align="start">
        <p className="text-sm">{message}</p>
        <Button
          size="sm"
          variant={variant}
          disabled={isPending}
          onClick={action}>
          {isPending ? pendingLabel : confirmLabel}
        </Button>
      </PopoverContent>
    </Popover>
  )
}
