'use client'

import { useState } from 'react'
import { Button } from '@/components/button'
import { AssetsManager } from '@/components/assets-manager'
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
  const [activeTool, setActiveTool] = useState<AssetType | null>(null)
  const [open, setOpen] = useState(false)

  const handleToolClick = (toolId: AssetType) => {
    setActiveTool(toolId)
    setOpen(true)
  }

  return (
    <>
      <div className="fixed top-1/2 left-8 z-40 -translate-y-1/2">
        <div className="glass relative flex flex-col gap-1 rounded-full p-1">
          {tools.map(tool => (
            <Button
              key={tool.id}
              variant="ghost"
              size="icon-lg"
              onClick={() => handleToolClick(tool.id)}
              tooltip={tool.label}
              className={cn(
                'cursor-pointer rounded-full transition-all duration-300',
                activeTool === tool.id && open
                  ? 'bg-white text-black shadow-[0_4px_16px_rgba(255,255,255,0.15)]'
                  : 'text-white/50 hover:bg-white/10 hover:text-white'
              )}>
              <div
                className="aspect-square size-6 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${tool.icon})` }}
              />
            </Button>
          ))}
        </div>
      </div>

      {activeTool && (
        <AssetsManager
          type={activeTool}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  )
}
