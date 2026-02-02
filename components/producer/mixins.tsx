import {
  Button,
  ButtonGroup,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Toggle,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  MoreHorizontalIcon,
  MailCheckIcon,
  ArchiveIcon,
  ClockIcon,
  CalendarPlusIcon,
  ListFilterIcon,
  TagIcon,
  Trash2Icon
} from 'lucide-react'
import { assetTypes } from '@/lib/constants'
import type { AssetType, AssetValue } from '@/lib/types'
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover'

export type MixinsProps = {
  value?: AssetValue
}

export function Mixins ({ value }: MixinsProps) {
  return (
    <ButtonGroup className="-mt-px h-7 rounded-none bg-white/20">
      {assetTypes.filter(t => t.type !== 'face').map((mixin) => (
        <Popover key={mixin.type}>
          <PopoverTrigger asChild>
            <Button
              key={mixin.name}
              type="button"
              variant="outline"
              className={cn('h-7 rounded-none text-xs px-2 tube',
                value?.hasOwnProperty(mixin.type) ? 'on' : '',
              )}>
              {mixin.name}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="top"
            sideOffset={0}
            className="w-40 p-2 draw-up overflow-hidden border-border rounded-top glass">
            <div className="flex gap-1 flex-col justify-start items-start min-h-40">
              <Toggle variant="outline" size="sm" className="mixin">black-long-straight</Toggle>
              <Toggle variant="outline" size="sm" className="mixin">wavy</Toggle>
            </div>
          </PopoverContent>
        </Popover>
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-7 rounded-none text-xs"
            aria-label="More Options">
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          side="top"
          sideOffset={12}
          className={cn(
            'w-48',
            'draw-up',
            'glass'
          )}>
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <MailCheckIcon />
              Mark as Read
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ArchiveIcon />
              Archive
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <ClockIcon />
              Snooze
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CalendarPlusIcon />
              Add to Calendar
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ListFilterIcon />
              Add to List
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <TagIcon />
                Label As...
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup>
                  <DropdownMenuRadioItem value="personal">
                    Personal
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="work">
                    Work
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="other">
                    Other
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <DropdownMenuItem variant="destructive">
              <Trash2Icon />
              Trash
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  )
}
