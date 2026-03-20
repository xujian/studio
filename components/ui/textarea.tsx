import * as React from "react"
import { useId } from 'react'

import { cn } from "@/lib/utils"

export type TextAreaProps = {
  label?: string
} & React.ComponentProps<"textarea">

function Textarea({ label, className, ...props }: TextAreaProps) {
  const id = useId()
  return (
    <div className={cn(
      'border-input bg-background',
      'focus-within:border-ring focus-within:ring-ring/50',
      'has-aria-invalid:ring-destructive/20',
      'dark:has-aria-invalid:ring-destructive/40 has-aria-invalid:border-destructive',
      'relative w-full rounded-md',
      'border shadow-xs transition-[color,box-shadow]',
      'outline-none focus-within:ring-[3px]',
      'has-disabled:pointer-events-none',
      'has-disabled:cursor-not-allowed has-disabled:opacity-50',
      'has-[input:is(:disabled)]:*:pointer-events-none',
      className)}>
      {label && (
        <label htmlFor={id}
          className='text-foreground block px-2 pt-2 text-xs font-medium'>
          Content
        </label>)
      }
      <textarea
        id={id}
        className='text-foreground h-full placeholder:text-muted-foreground/70 flex w-full px-3 py-2 text-sm focus-visible:outline-none min-h-28 resize-none'
        {...props}
      />
    </div>
  )
}

export { Textarea }
