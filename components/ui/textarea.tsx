import * as React from "react"
import { useId } from 'react'

import { cn } from "@/lib/utils"

export type TextAreaProps = {
  label?: string,
} & React.ComponentProps<"textarea">

function Textarea({ label, className, children, ...props }: TextAreaProps) {
  const id = useId()
  return (
    <div className={cn(
      'border-input bg-background',
      'focus-within:border-ring focus-within:ring-ring/50',
      'has-aria-invalid:ring-destructive/20',
      'dark:has-aria-invalid:ring-destructive/40 has-aria-invalid:border-destructive',
      'relative w-full rounded-xl',
      'border shadow-xs transition-[color,box-shadow]',
      'outline-none focus-within:ring-[3px]',
      'has-disabled:pointer-events-none',
      'has-disabled:cursor-not-allowed has-disabled:opacity-50',
      'has-[input:is(:disabled)]:*:pointer-events-none',
      className)}>
      {label && (
        <label htmlFor={id}
          className='text-muted-foreground block px-2 pt-2 text-xs font-medium'>
          { label }
        </label>)
      }
      <textarea
        id={id}
        className='text-foreground h-full placeholder:text-muted-foreground/70 flex w-full px-2 py-1 text-sm focus-visible:outline-none min-h-28 resize-none leading-4'
        {...props}
      />
      {children}
    </div>
  )
}

export { Textarea }
