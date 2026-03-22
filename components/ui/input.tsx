import { useId } from 'react'
import { cn } from '@/lib/utils'

export type InputProps = {
  label?: string,
  required?: boolean,
} & React.ComponentProps<'input'>

export const Input = ({ label, required, className, children, ...props }: InputProps) => {
  const id = useId()

  return (
    <div
      className={cn(
        'border-input bg-background',
        'focus-within:border-ring focus-within:ring-ring/50',
        'has-aria-invalid:ring-destructive/20',
        'has-aria-invalid:border-destructive dark:has-aria-invalid:ring-destructive/40',
        'relative w-full rounded-xl overflow-hidden',
        'border shadow-xs',
        'transition-[color,box-shadow] outline-none',
        'focus-within:ring-[3px]',
        'has-disabled:pointer-events-none has-disabled:cursor-not-allowed',
        'has-disabled:opacity-50 has-[input:is(:disabled)]:*:pointer-events-none',
        className
      )}>
      {label && (
        <label
          htmlFor={id}
          className="block px-2 pt-2 text-xs font-medium text-foreground/75 dark:bg-input/30">
          {label}
          {
            required && <span className="text-destructive"> *</span>
          }
        </label>
      )}
      <input
        id={id}
        data-lpignore="true"
        className="flex h-9 w-full bg-transparent px-3 pb-1 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none dark:bg-input/30"
        {...props}
      />
      {children}
    </div>
  )
}
