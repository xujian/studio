import * as React from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui'
import { Button, ButtonProps } from '@/components/button'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ConfirmButtonProps = {
  message: string
  isPending?: boolean
  action: React.MouseEventHandler<HTMLButtonElement>
} & ButtonProps

export function ConfirmButton({
  message,
  isPending = false,
  action,
  children,
  className,
  ...props
}: ConfirmButtonProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="destructive"
          size={ props.size || "xs"}
          {...props}>
          { isPending
            ? <Loader2 className="animate-spin" />
            : children
          }
        </Button>
      </PopoverTrigger>
      <PopoverContent
        role="alertdialog"
        aria-label={message}
        className="z-101 flex w-auto min-w-80 items-center justify-between rounded-xl bg-popover gap-2 p-1 pl-2"
        side="top"
        align="start">
        <p className="text-sm">{message}</p>
        <Button
          size="xs"
          disabled={isPending}
          onClick={action}>
          {isPending
            ? <Loader2 className="animate-spin" />
            : 'Confirm'}
        </Button>
      </PopoverContent>
    </Popover>
  )
}
