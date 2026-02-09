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
    { id: 'layers', label: 'Layers', icon: Layers },
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'grid', label: 'Grid View', icon: Grid3X3 },
    { id: 'move', label: 'Move', icon: Move },
    { id: 'zoom', label: 'Zoom', icon: ZoomIn }
  ]

  const actions = [
    { id: 'download', label: 'Download', icon: Download },
    { id: 'share', label: 'Share', icon: Share2 },
    { id: 'favorite', label: 'Favorite', icon: Heart },
  ]

  return (
    <div className="fixed top-1/2 left-8 z-40 -translate-y-1/2">
      <div className="relative flex flex-col p-2 gap-2 glass rounded-full">
        {tools.map(tool => {
          const Icon = tool.icon
          return (
            <Button
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
              <Icon className="size-5" />
            </Button>
          )
        })}
        {actions.map(action => {
          const Icon = action.icon
          return (
            <Button
              variant="ghost"
              size="icon-lg"
              tooltip={action.label}
              className={cn(
                'rounded-full transition-all duration-300 cursor-pointer',
                'text-white/50 hover:bg-white/10 hover:text-white',
              )}>
              <Icon className="size-5" />
            </Button>
          )
        })}
      </div>
    </div>
  )
}
