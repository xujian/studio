'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Sheet, SheetPortal, SheetOverlay, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

type SidepaneProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function Sidepane({
  open,
  onOpenChange,
  title,
  children,
  className
}: SidepaneProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPortal>
        <SheetOverlay className="bg-black/40" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            'sidepane fixed top-4 right-4 bottom-4 z-50 overflow-hidden',
            'flex w-full flex-col sm:max-w-sm',
            'glass rounded-3xl shadow-glass-lg',
            'data-[state=open]:animate-in data-[state=open]:slide-in-from-right',
            'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right',
            'duration-300 ease-in-out',
            className,
          )}>
          <DialogPrimitive.Close
            className="absolute z-2 top-1 right-1 flex size-9 bg-muted cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <X className="size-6" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
          { title
            ? (<div className="sidepane-title flex shrink-0 items-center justify-between px-4">
                <SheetTitle className="text-sm font-semibold my-4">{title}</SheetTitle>
              </div>)
            : (<SheetTitle sr-only="true" className="hidden" />)
          }
          <div className="sidepane-content bg-popover rounded-3xl min-h-0 flex-1 overflow-y-auto overscroll-contain" data-lenis-prevent>
            {children}
          </div>
        </DialogPrimitive.Content>
      </SheetPortal>
    </Sheet>
  )
}
