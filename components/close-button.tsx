import { Button } from './ui'
import { X } from 'lucide-react'

export type CloseButtonProps = {
  size?: React.ComponentProps<typeof Button>['size']
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  className?: string
}

export function CloseButton({ size, onClick, ...props }: CloseButtonProps) {
  return (
    <Button
      type="button"
      size={size}
      onClick={onClick}
      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/60 text-foreground hover:bg-background/80"
      {...props}>
      <X className="h-3 w-3" />
    </Button>
  )
}
