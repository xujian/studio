import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui'
import { Asset } from '@/lib/types'
import { Ellipsis, Eye, Mouse } from 'lucide-react'

export type AssetMenuProps = {
  asset: Asset
  onUse?: () => void
  onView?: () => void
}

export const AssetMenu = ({ asset, onUse, onView }: AssetMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon-sm"
          className="h-6 w-8 bg-background!"
          variant="outline">
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="z-200 w-full rounded-xl text-xs">
        <DropdownMenuLabel className="text-xs bg-muted rounded-md">
          <div className="name">
            {asset.title || asset.name}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuItem className="text-xs" onClick={onUse}>
          <Mouse className="size-4 text-muted-foreground" />
          Use
        </DropdownMenuItem>
        <DropdownMenuItem className="text-xs" disabled>
          <Eye className="size-4 text-muted-foreground" />
          View
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
