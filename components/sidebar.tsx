'use client'

import { useBus } from '@/lib/bus'
import { Button } from '@/components/button'
import { cn } from '@/lib/utils'
import type { AssetType } from '@/lib/types'

const tools = [
  { id: 'face' as AssetType, label: 'Face', icon: '/icons/face.png' },
  { id: 'hair' as AssetType, label: 'Hair', icon: '/icons/hair.png' },
  { id: 'outfit' as AssetType, label: 'Outfit', icon: '/icons/outfit.png' },
  { id: 'scene' as AssetType, label: 'Scene', icon: '/icons/scene.png' },
  { id: 'camera' as AssetType, label: 'Camera', icon: '/icons/camera.png' },
  { id: 'mood' as AssetType, label: 'Mood', icon: '/icons/mood.png' },
]

export default function Sidebar() {
  const $bus = useBus()

  return (
    <div className="fixed top-1/2 left-8 z-40 -translate-y-1/2">
      <div className="glass relative flex flex-col gap-1 rounded-full p-1">
        {tools.map(tool => (
          <Button
            key={tool.id}
            variant="ghost"
            size="icon-lg"
            onClick={() => $bus.emit('assets:open', { type: tool.id })}
            tooltip={tool.label}
            className={cn(
              'cursor-pointer rounded-full transition-all duration-300',
              'text-white/50 hover:bg-white/10 hover:text-white'
            )}>
            <div
              className="aspect-square size-6 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${tool.icon})` }}
            />
          </Button>
        ))}
      </div>
    </div>
  )
}
