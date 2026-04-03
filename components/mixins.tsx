import * as React from 'react'
import { Peekable } from '@/components/peekable'
import {
  Button,
  ButtonGroup,
  Toggle,
  Popover,
  PopoverTrigger,
  PopoverContent
} from '@/components/ui'
import { assets as assetDefines } from '@/lib/assets-config'
import type { AssetType, Mixins } from '@/lib/types'
import { assetUrl, cn, removeAssetImage } from '@/lib/utils'
import { useAssets } from '@/hooks/use-assets'
import { MoreHorizontalIcon } from 'lucide-react'
import { AssetPreview } from './asset-preview'
import { useCreateAsset } from '@/hooks/use-create-asset'
import { Textarea } from '@/components/ui/textarea'
import { Upload } from '@/components/upload'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

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

  const [openType, setOpenType] = React.useState<AssetType | null>(null)
  const [adHocType, setAdHocType] = React.useState<AssetType | null>(null)
  const [adHocTab, setAdHocTab] = React.useState<'text' | 'image'>('text')
  const [adHocContent, setAdHocContent] = React.useState('')
  const [adHocPath, setAdHocPath] = React.useState('')
  const createAsset = useCreateAsset()

  const resetAdHoc = () => {
    if (adHocPath) removeAssetImage(adHocPath)
    setAdHocType(null)
    setAdHocTab('text')
    setAdHocContent('')
    setAdHocPath('')
  }

  const handleAdHocSave = (type: AssetType) => {
    createAsset.mutate(
      {
        name: '',
        type,
        content: adHocTab === 'text' ? adHocContent || undefined : undefined,
        path: adHocTab === 'image' ? adHocPath || null : null,
      },
      {
        onSuccess: (asset) => {
          handleSelect(type, asset.id!)
          setOpenType(null)
          // Reset state without deleting the image — it now belongs to the saved asset
          setAdHocType(null)
          setAdHocTab('text')
          setAdHocContent('')
          setAdHocPath('')
        }
      }
    )
  }

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
      {assetDefines
        .filter(t => t.id !== 'face')
        .map(d => {
          const typeAssets = (assetsByType[d.id] || []).filter(a => a.name !== '')
          const isSelected = d.id in value
          return (
            <Popover
              key={d.id}
              modal={false}
              open={openType === d.id}
              onOpenChange={(open) => {
                if (!open) resetAdHoc()
                setOpenType(open ? d.id as AssetType : null)
              }}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'tube group h-7 rounded-none px-2 text-xs',
                    isSelected ? 'on' : ''
                  )}>
                  {d.id}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                side="top"
                sideOffset={0}
                className="draw-up rounded-top glass w-48 border-border p-2 pr-0">
                {adHocType === d.id ? (
                  <div className="flex w-full flex-col gap-2 pr-2">
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      onClick={resetAdHoc}>
                      ← back
                    </button>
                    <Tabs
                      value={adHocTab}
                      onValueChange={(v) => {
                        if (v === 'text' && adHocPath) {
                          removeAssetImage(adHocPath)
                          setAdHocPath('')
                        }
                        setAdHocTab(v as 'text' | 'image')
                      }}>
                      <TabsList className="h-7 w-full">
                        <TabsTrigger value="text" className="flex-1 text-xs">Text</TabsTrigger>
                        <TabsTrigger value="image" className="flex-1 text-xs">Image</TabsTrigger>
                      </TabsList>
                      <TabsContent value="text">
                        <Textarea
                          autoFocus
                          rows={4}
                          placeholder={`Describe the ${d.id}...`}
                          value={adHocContent}
                          onChange={e => setAdHocContent(e.target.value)}
                          className="text-xs" />
                      </TabsContent>
                      <TabsContent value="image">
                        <Upload
                          path={({ userId }) => `assets/${userId}/${d.id}`}
                          value={adHocPath ? assetUrl(adHocPath) : undefined}
                          onComplete={setAdHocPath}
                          onClear={() => setAdHocPath('')}
                          className="aspect-video w-full" />
                      </TabsContent>
                    </Tabs>
                    <Button
                      type="button"
                      size="sm"
                      className="w-full"
                      disabled={
                        createAsset.isPending ||
                        (adHocTab === 'text' && !adHocContent.trim()) ||
                        (adHocTab === 'image' && !adHocPath)
                      }
                      onClick={() => handleAdHocSave(d.id as AssetType)}>
                      {createAsset.isPending ? 'Saving…' : 'Save'}
                    </Button>
                  </div>
                ) : (
                  <div
                    data-lenis-prevent-wheel
                    className="flex max-h-60 flex-col items-start justify-start gap-1 overflow-y-auto">
                    {isLoading ? (
                      <div className="p-2 text-xs text-muted-foreground">Loading...</div>
                    ) : typeAssets.length === 0 ? (
                      <div className="p-2 text-xs text-muted-foreground">No {d.id} assets yet</div>
                    ) : (
                      typeAssets.map(a => (
                        <Peekable
                          key={a.id}
                          content={
                            a.path
                              ? assetUrl(a.path!)
                              : () => (<AssetPreview asset={a} />)
                          }
                          title={a.title}
                          description={a.description}
                          side="right"
                          align="start"
                          offset={100}>
                          <div>
                            <Toggle
                              variant="outline"
                              size="sm"
                              className="mixin h-5 justify-start"
                              pressed={value[a.type] === a.id}
                              onPressedChange={() =>
                                handleSelect(a.type, a.id!)
                              }>
                              <span className="truncate text-xs">
                                {a.name}
                              </span>
                            </Toggle>
                          </div>
                        </Peekable>
                      ))
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-1 w-full justify-start text-xs text-muted-foreground"
                      onClick={() => setAdHocType(d.id as AssetType)}>
                      + Ad-hoc
                    </Button>
                  </div>
                )}
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
