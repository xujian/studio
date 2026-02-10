import * as React from 'react'
import { Button, ButtonGroup, Toggle } from '@/components/ui'
import { assetTypes } from '@/lib/constants'
import type { AssetType, AssetValue, Mixins } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useAssets } from '@/hooks/use-assets'
import { Popover, PopoverTrigger, PopoverContent } from '../ui'
import { MoreHorizontalIcon, XIcon } from 'lucide-react'

export type MixinsProps = {
  value?: Mixins
  onChange?: (value: Mixins) => void
}

export function Mixins({ value = {}, onChange }: MixinsProps) {
  const { data: assets = [], isLoading } = useAssets()
  const [openPopover, setOpenPopover] = React.useState<AssetType | null>(null),
    [selected, setSelected] = React.useState<Mixins>(value) 

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

  React.useEffect(() => {
    setSelected(value)
  }, [value])

  const handleTogglePopover = (type: AssetType) => {
    setOpenPopover(prev => (prev === type ? null : type))
  }

  const handleClosePopover = () => {
    setOpenPopover(null)
  }

  const handleSelect = (type: AssetType, assetId: string) => {
    const v = {
      ...selected,
    }
    if (v[type] === assetId) {
      // Deselect if clicking the same asset
      delete v[type]
    } else {
      // Select new asset
      v[type] = assetId
    }
    setSelected(v)
    onChange?.(v)
    setOpenPopover(null)
  }

  const handleClear = (type: AssetType, e: React.MouseEvent) => {
    e.stopPropagation()
    const newValue = { ...value }
    delete newValue[type]
    onChange?.(newValue)
  }

  return (
    <ButtonGroup className="-mt-px h-7 rounded-none bg-white/20">
      {assetTypes
        .filter(t => t.type !== 'face')
        .map(assetType => {
          const typeAssets = assetsByType[assetType.type] || []
          const isSelected = selected.hasOwnProperty(assetType.type)
          const selectedAsset = isSelected
            ? assets.find(a => a.id === selected[assetType.type])
            : null
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
                className="draw-up rounded-top glass w-48 overflow-hidden border-border p-2">
                <div className="flex max-h-60 flex-col items-start justify-start gap-1 overflow-y-auto">
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
                      <Toggle
                        key={asset.id}
                        variant="outline"
                        size="sm"
                        className="mixin w-full justify-start data-[state=on]:bg-accent"
                        pressed={selected[assetType.type] === asset.id}
                        onPressedChange={() =>
                          handleSelect(assetType.type, asset.id!)
                        }>
                        <span className="truncate">{asset.name}</span>
                      </Toggle>
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
