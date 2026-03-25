import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
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
  const faceRows = Math.ceil(faces.length / 4)

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
        <PopoverContent className="draw-left w-88 mt-4 bg-popover rounded-3xl rounded-r-none glass p-1"
          side="left" sideOffset={4} align="start">
          {faces.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-4">
              <p className="text-sm text-muted-foreground text-center">No face assets yet</p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/store?type=face">Browse Face Assets</Link>
              </Button>
            </div>
          ) : (
            <Carousel
              className="flex items-center gap-1">
              <CarouselContent className="h-18 ml-0">
                {Array(faceRows).fill('').map((_, row) => (
                  <CarouselItem key={row} className="carousel-item flex h-18 p-0 gap-1">
                    {faces.slice(row * 4, row * 4 + 4).map((face) => (
                      <Peekable key={face.id}
                        content={assetUrl(face.path!)}
                        title={face.title}
                        description={face.description}>
                        {face.path ? (
                          <Image
                            src={assetUrl(face.path!)}
                            alt={face.name || 'Face asset'}
                            width={72}
                            height={72}
                            className="face object-cover rounded-xl cursor-pointer border border-primary/80 hover:border-primary"
                            sizes="72px"
                            aria-label={`Select face: ${face.name || 'Unnamed'}`}
                            onClick={() => onSelect?.(face.id!)}
                          />
                        ) : (
                          face.name
                        )}
                      </Peekable>
                    ))}
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex flex-col gap-1 shrink-0">
                <CarouselPrevious className="relative top-auto left-auto translate-x-0 translate-y-0 h-8 w-8" />
                <CarouselNext className="relative top-auto left-auto translate-x-0 translate-y-0 right-0 h-8 w-8" />
              </div>
            </Carousel>
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
