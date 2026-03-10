'use client'

import { useState } from 'react'
import { Button } from '@/components/button'
import { cn } from '@/lib/utils'
import {
  Layers,
  Palette,
  Grid3X3,
  Move,
  ZoomIn,
  Download,
  Share2,
  Heart,
} from 'lucide-react'

export default function Sidebar() {
  const [activeTool, setActiveTool] = useState('enhance')

  const tools = [
    { id: 'face', label: 'Face', icon: '/icons/face.png' },
    { id: 'hair', label: 'Hair', icon: '/icons/hair.png' },
    { id: 'outfit', label: 'Outfit', icon: '/icons/outfit.png' },
    { id: 'scene', label: 'Scene', icon: '/icons/scene.png' },
    { id: 'camera', label: 'Camera', icon: '/icons/camera.png' },
    { id: 'mood', label: 'Mood', icon: '/icons/mood.png' }
  ]

  const actions = [
    { id: 'download', label: 'Download', icon: Download },
    { id: 'share', label: 'Share', icon: Share2 },
    { id: 'favorite', label: 'Favorite', icon: Heart },
  ]

  return (
    <div className="fixed top-1/2 left-8 z-40 -translate-y-1/2">
      <div className="relative flex flex-col p-1 gap-1 glass rounded-full">
        {tools.map(tool => {
          return (
            <Button
              key={tool.id}
              variant="ghost"
              size="icon-lg"
              onClick={() => setActiveTool(tool.id)}
              tooltip={tool.label}
              className={cn(
                'rounded-full transition-all duration-300 cursor-pointer',
                activeTool === tool.id
                  ? 'bg-white text-black shadow-[0_4px_16px_rgba(255,255,255,0.15)]'
                  : 'text-white/50 hover:bg-white/10 hover:text-white'
              )}>
              <div className="aspect-square bg-cover bg-center bg-no-repeat size-6" style={{
                backgroundImage:`url(${tool.icon})`
              }}></div>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
