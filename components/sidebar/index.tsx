'use client'

import { useState } from 'react'
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui'
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
    <TooltipProvider delayDuration={100}>
      <div className="fixed top-1/2 left-8 z-40 -translate-y-1/2">
        <div className="relative flex flex-col p-2 gap-2 glass rounded-full">
          {tools.map(tool => {
            const Icon = tool.icon
            return (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    onClick={() => setActiveTool(tool.id)}
                    className={cn(
                      'rounded-full transition-all duration-300 cursor-pointer',
                      activeTool === tool.id
                        ? 'bg-white text-black shadow-[0_4px_16px_rgba(255,255,255,0.15)]'
                        : 'text-white/50 hover:bg-white/10 hover:text-white'
                    )}>
                    <Icon className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="rounded-xl border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white backdrop-blur-2xl glass">
                  {tool.label}
                </TooltipContent>
              </Tooltip>
            )
          })}
          {actions.map(action => {
            const Icon = action.icon
            return (
              <Tooltip key={action.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    className={cn(
                      'rounded-full transition-all duration-300 cursor-pointer',
                      'text-white/50 hover:bg-white/10 hover:text-white',
                    )}>
                    <Icon className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="rounded-xl border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white shadow-[0_4px_16px_rgba(0,0,0,0.3)] backdrop-blur-2xl">
                  {action.label}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}
