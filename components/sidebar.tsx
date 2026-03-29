'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/button'
import { useBus } from '@/lib/bus'
import type { AssetType } from '@/lib/types'
import { cn } from '@/lib/utils'

const tools = [
  { id: 'face' as AssetType, label: 'Face', icon: '/icons/face.png' },
  { id: 'hair' as AssetType, label: 'Hair', icon: '/icons/hair.png' },
  { id: 'makeup' as AssetType, label: 'Makeup', icon: '/icons/makeup.png' },
  { id: 'outfit' as AssetType, label: 'Outfit', icon: '/icons/outfit.png' },
  { id: 'scene' as AssetType, label: 'Scene', icon: '/icons/scene.png' },
  { id: 'camera' as AssetType, label: 'Camera', icon: '/icons/camera.png' },
  { id: 'mood' as AssetType, label: 'Mood', icon: '/icons/mood.png' }
]

export default function Sidebar() {
  const $bus = useBus()
  const [activeTool, setActiveTool] = useState<AssetType | null>(null)

  useEffect(() => {
    $bus.on('assets:open', ({ type }) => setActiveTool(type))
    $bus.on('assets:close', () => setActiveTool(null))
  }, [])

  return (
    <div className="fixed top-1/2 left-8 z-40 -translate-y-1/2 hidden md:block">
      <nav aria-label="Asset tools" className="glass relative flex flex-col gap-1 rounded-full p-1">
        {tools.map(tool => (
          <Button
            key={tool.id}
            variant="ghost"
            size="icon-lg"
            onClick={() => $bus.emit('assets:open', { type: tool.id })}
            tooltip={tool.label}
            aria-label={tool.label}
            aria-pressed={activeTool === tool.id}
            className={cn(
              'cursor-pointer rounded-full transition-all duration-300',
              activeTool === tool.id
                ? 'bg-foreground/20'
                : 'bg-foreground/10'
            )}>
            <div
              aria-hidden="true"
              className="aspect-square size-6 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${tool.icon})` }}
            />
          </Button>
        ))}
      </nav>
    </div>
  )
}
