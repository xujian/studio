import * as React from 'react'
import { Button, ButtonGroup, Toggle } from '@/components/ui'
import { assetTypes } from '@/lib/constants'
import type { AssetType, Mixins } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useAssets } from '@/hooks/use-assets'
import { Popover, PopoverTrigger, PopoverContent } from '../ui'
import { Peekable } from '@/components/peekable'
import { MoreHorizontalIcon } from 'lucide-react'

export type MixinsProps = {
  value?: Mixins
  onChange?: (value: Mixins) => void
}

export function Mixins({ value = {}, onChange }: MixinsProps) {
  const { data: assets = [], isLoading } = useAssets()

  // Group assets by type
  const assetsByType = React.useMemo(() => {
    const grouped: Record<string, typeof assets> = {}
    assets.forEach(asset => {
      if (!grouped[asset.type]) {
        grouped[asset.type] = []
      }
      grouped[asset.type].push(asset)
    })
    return grouped
  }, [assets])

  const handleSelect = (type: AssetType, assetId: string) => {
    const v = { ...value }
    if (v[type] === assetId) {
      delete v[type]
    } else {
      v[type] = assetId
    }
    onChange?.(v)
  }

  return (
    <ButtonGroup className="-mt-px h-7 rounded-none bg-foreground/10">
      {assetTypes
        .filter(t => t.type !== 'face')
        .map(assetType => {
          const typeAssets = assetsByType[assetType.type] || []
          const isSelected = assetType.type in value
          return (
            <Popover key={assetType.type} modal={false}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'tube group h-7 rounded-none px-2 text-xs',
                    isSelected ? 'on' : ''
                  )}>
                  {assetType.name}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                side="top"
                sideOffset={0}
                className="draw-up rounded-top glass w-48 border-border p-2">
                <div data-lenis-prevent-wheel className="max-h-60 overflow-y-auto flex flex-col items-start justify-start gap-1">
                    {isLoading ? (
                      <div className="p-2 text-xs text-muted-foreground">
                        Loading...
                      </div>
                    ) : typeAssets.length === 0 ? (
                      <div className="p-2 text-xs text-muted-foreground">
                        No {assetType.name.toLowerCase()} assets yet
                      </div>
                    ) : (
                      typeAssets.map(asset => (
                        <Peekable key={asset.id}
                          content={asset.path || asset.content}
                          title={asset.title}
                          description={asset.description}
                          side="right">
                          <div>{/** to tix the toggle's pressed state */}
                            <Toggle
                              variant="outline"
                              size="sm"
                              className="h-5 mixin justify-start"
                              pressed={value[assetType.type] === asset.id}
                              onPressedChange={() =>
                                handleSelect(assetType.type, asset.id!)
                              }>
                              <span className="truncate text-xs">{asset.name}</span>
                            </Toggle>
                          </div>
                        </Peekable>
                      ))
                    )}
                  </div>
              </PopoverContent>
            </Popover>
          )
        })}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="tube group h-7 rounded-none px-2 text-xs">
            <MoreHorizontalIcon />
          </Button>
        </PopoverTrigger>
      </Popover>
    </ButtonGroup>
  )
}
