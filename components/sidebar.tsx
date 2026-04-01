'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/button'
import { useBus } from '@/lib/bus'
import type { AssetType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { assets } from '@/lib/assets-config'

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
        {assets.map(asset => (
          <Button
            key={asset.id}
            variant="ghost"
            size="icon-lg"
            onClick={() => $bus.emit('assets:open', { type: asset.id })}
            tooltip={asset.label}
            aria-label={asset.label}
            aria-pressed={activeTool === asset.id}
            className={cn(
              'cursor-pointer rounded-full transition-all duration-300',
              activeTool === asset.id
                ? 'bg-foreground/20'
                : 'bg-foreground/10'
            )}>
            <div
              aria-hidden="true"
              className="aspect-square size-6 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${asset.icon})` }}
            />
          </Button>
        ))}
      </nav>
    </div>
  )
}
