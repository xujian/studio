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

const systemFace = '/face.png'

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
                  className={cn('p-0 m-0 w-12 h-12 bg-black rounded cursor-pointer')}
                  style={{
                    backgroundImage: selected
                      ? `url(${selectedFace?.path})`
                      : `url(${systemFace})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center top'
                  }} />
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" className="tooltip" sideOffset={8}>
              <p>Choose face</p>
            </TooltipContent>
          </Tooltip>
        <PopoverContent className="draw-left min-h-20 w-80 mt-4 bg-black rounded-xl glass p-2"
          side="left" sideOffset={12} align="start">
          {faces.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-4">
              <p className="text-sm text-muted-foreground text-center">No face assets yet</p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/store?type=face">Browse Face Assets</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {faces.map(face => (
                <Peekable key={face.id}
                  content={assetUrl(face.path!)}
                  title={face.title}
                  description={face.description}>
                  <Button
                    variant="outline"
                    onClick={() => onSelect?.(face.id!)}
                    className={cn(
                      'face rounded w-16 h-16 p-0 text-xs transition glow cursor-pointer',
                      selected === face.id ? 'on' : ''
                    )}>
                    {face.path ? (
                      <img
                        src={assetUrl(face.path!)}
                        alt={face.name}
                      />
                    ) : (
                      face.name
                    )}
                  </Button>
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
          className="absolute h-4 w-4 px-0! py-0 left-4 -bottom-1 cursor-pointer bg-black hover:bg-amber-800 text-white">
          <X />
        </Button>
      )}
    </div>
  )
}
