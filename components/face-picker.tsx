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
import { Asset } from '@/lib/types'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

export type FacePickerProps = {
  faces: Asset[],
  value?: Asset
}

const systemFace = '/face.png'

export function FacePicker ({ faces, value }: FacePickerProps) {
  const [selectedFace, setSelectedFace] = useState<Asset | null>(value || null)
  const [popoverOpen, setPopoverOpen] = useState(false)

  return (
    <div className="relative">
      <TooltipProvider delayDuration={600}>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <Tooltip open={popoverOpen ? false : undefined}>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant={selectedFace ? "ghost" :  "outline"}
                  className={cn('p-0 m-0 w-12 h-12 bg-black rounded cursor-pointer')}
                  style={{
                    backgroundImage: selectedFace ? `url(${selectedFace.url})` : `url(${systemFace})`,
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
                <Button
                  key={face.id}
                  variant="outline"
                  onClick={() => setSelectedFace(face)}
                  className={cn(
                    'rounded w-16 h-16 p-0 text-xs transition glow cursor-pointer',
                    selectedFace?.id === face.id ? 'on' : ''
                  )}
                  title={face.name}>
                  {face.url ? (
                    <img
                      src={face.url}
                      alt={face.name}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    face.name
                  )}
                </Button>
              ))}
            </div>
          )}
        </PopoverContent>
        </Popover>
      </TooltipProvider>
      {selectedFace && (
        <Button
          onClick={() => setSelectedFace(null)}
          className="absolute h-4 w-4 px-0! py-0 left-4 -bottom-1 cursor-pointer bg-black hover:bg-amber-800 text-white">
          <X />
        </Button>
      )}
    </div>
  )
}
