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

const mixins = [
  { name: 'Face', tooltip: 'Face' },
  { name: 'Makeup', tooltip: 'Makeup' },
  { name: 'Hair', tooltip: 'Hair' },
  { name: 'Attire', tooltip: 'Attire' },
  { name: 'Expression', tooltip: 'Expression' },
  { name: 'Scene', tooltip: 'Scene' },
  { name: 'Lighting', tooltip: 'Lighting' },
  { name: 'Camera', tooltip: 'Camera' },
]

export function Mixins () {
  return (
    <ButtonGroup className="-mt-px h-7 rounded-none bg-white/20">
      {mixins.map((mixin) => (
        <Button
          key={mixin.name}
          type="button"
          variant="outline"
          className="h-7 rounded-none text-xs px-2">
          {mixin.name}
        </Button>
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
            'data-[state=closed]:slide-out-to-left-0 data-[state=open]:slide-in-from-left-0',
            'data-[state=closed]:slide-out-to-bottom-20 data-[state=open]:slide-in-from-bottom-20',
            'data-[state=closed]:zoom-out-100',
            'duration-600',
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
