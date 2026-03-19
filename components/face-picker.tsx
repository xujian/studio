import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui'
import { Peekable } from '@/components/peekable'
import { Asset } from '@/lib/types'
import { assetUrl, cn } from '@/lib/utils'
import { X } from 'lucide-react'

export type FacePickerProps = {
  faces: Asset[],
  selected?: string,
  onSelect?: (faceId: string) => void
}

const systemFace = '/icons/face.png'

export function FacePicker ({ faces, selected, onSelect }: FacePickerProps) {
  const [popoverOpen, setPopoverOpen] = useState(false)

  const selectedFace = faces.find(f => f.id === selected)

  return (
    <div className="relative">
      <TooltipProvider delayDuration={600}>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <Tooltip open={popoverOpen ? false : undefined}>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant={selected ? "ghost" :  "outline"}
                  className={cn(
                    'p-0 m-0 w-18 h-18 border bg-image rounded-xl cursor-pointer'
                  )}
                  style={{
                    backgroundImage: selected
                      ? `url(${assetUrl(selectedFace?.path ?? '')})`
                      : `url(${systemFace})`,
                    backgroundSize: selected
                      ? 'cover'
                      : '48px'
                  }} />
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" className="tooltip" sideOffset={8}>
              <p>Choose face</p>
            </TooltipContent>
          </Tooltip>
        <PopoverContent className="draw-left min-h-20 w-80 mt-4 bg-popover rounded-3xl rounded-r-none glass p-1"
          side="left" sideOffset={4} align="start">
          {faces.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-4">
              <p className="text-sm text-muted-foreground text-center">No face assets yet</p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/store?type=face">Browse Face Assets</Link>
              </Button>
            </div>
          ) : (
            <div className="flex gap-1">
              {faces.map(face => (
                <Peekable key={face.id}
                  content={assetUrl(face.path!)}
                  title={face.title}
                  description={face.description}>
                  {face.path ? (
                  <button
                    type="button"
                    className='face w-18 h-18 cursor-pointer rounded-xl overflow-hidden focus-visible:ring-2 focus-visible:ring-ring'
                    aria-label={`Select face: ${face.name || 'Unnamed'}`}
                    onClick={() => onSelect?.(face.id!)}>
                    <Image
                      src={assetUrl(face.path!)}
                      alt={face.name || 'Face asset'}
                      width={72}
                      height={72}
                      className="object-cover rounded-xl"
                      sizes="72px"
                    />
                  </button>
                  ) : (
                    face.name
                  )}
                </Peekable>
              ))}
            </div>
          )}
        </PopoverContent>
        </Popover>
      </TooltipProvider>
      {selected && (
        <Button
          onClick={() => onSelect?.('')}
          aria-label="Clear face selection"
          className="absolute h-6 w-6 px-0! py-0 left-7 bottom-0 bg-foreground hover:bg-foreground/70 text-background">
          <X />
        </Button>
      )}
    </div>
  )
}
