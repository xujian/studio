import { Button } from './ui'
import { X } from 'lucide-react'

export type CloseButtonProps = {} & React.HTMLAttributes<HTMLButtonElement>

export function CloseButton({ onClick, ...props }: CloseButtonProps) {
  return (
    <Button
      type="button"
      size="icon"
      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/60 text-foreground hover:bg-background/80"
      onClick={onClick}>
      <X className="h-3 w-3" />
    </Button>
  )
}
