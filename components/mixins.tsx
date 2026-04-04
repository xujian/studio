import * as React from 'react'
import { Peekable } from '@/components/peekable'
import {
  Button,
  ButtonGroup,
  Toggle,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui'
import Image from 'next/image'
import { assets as assetDefines } from '@/lib/assets-config'
import type { AssetType, Mixins, AdHocContent, LocalMixins } from '@/lib/types'
import { assetUrl, cn } from '@/lib/utils'
import { useAssets } from '@/hooks/use-assets'
import { ArrowLeft, ArrowUpCircle, Check, MoreHorizontalIcon, X } from 'lucide-react'
import { AssetPreview } from './asset-preview'
import { Textarea } from '@/components/ui/textarea'
import { Dropzone } from '@/components/dropzone'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export type MixinsProps = {
  value?: LocalMixins
  onChange?: (value: LocalMixins) => void
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
  const [adhocType, setAdhocType] = React.useState<AssetType | null>(null)
  const [adhocTab, setAdhocTab] = React.useState<'text' | 'image'>('text')
  const [adhocContent, setAdhocContent] = React.useState('')
  const [adhocDataUrl, setAdhocDataUrl] = React.useState('')

  const resetAdhoc = () => {
    setAdhocType(null)
    setAdhocTab('text')
    setAdhocContent('')
    setAdhocDataUrl('')
  }

  const doneAdhoc = (type: AssetType) => {
    const entry: AdHocContent = adhocTab === 'text'
      ? { content: adhocContent }
      : { dataUrl: adhocDataUrl }
    onChange?.({ ...value, [type]: entry })
    setOpenType(null)
    resetAdhoc()
  }

  const handleSelect = (type: AssetType, assetId: string) => {
    const v = { ...value }
    const current = v[type]
    if (typeof current === 'string' && current === assetId) {
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

          const adHocEntry = value[d.id as AssetType]
          const adHocValue = adHocEntry && typeof adHocEntry === 'object' ? adHocEntry as AdHocContent : null

          const renderAdhoc = () => (
            <div
              className="relative w-30 h-30 cursor-pointer"
              onClick={() => setAdhocType(d.id as AssetType)}>
              <Button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange?.({ ...value, [d.id]: undefined })
                }}
                aria-label="Clear ad-hoc"
                className="absolute h-6 w-6 px-0! py-0 right-1 bottom-1 z-10 bg-foreground hover:bg-foreground/70 text-background">
                <X />
              </Button>
              {'dataUrl' in adHocValue!
                ? (<Image
                    src={adHocValue!.dataUrl}
                    width={120}
                    height={120}
                    className="size-28 object-cover rounded-sm border border-border!"
                    alt="ad-hoc" />)
                : <div className="line-clamp-2 px-1 py-1 text-left text-xs rounded-md text-muted-foreground">
                    {(adHocValue as { content: string }).content}
                  </div>
              }
            </div>
          )

          const renderAdhocTrigger = () => (<Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="mt-1 h-5 w-32 justify-start text-xs text-muted-foreground"
              onClick={() => setAdhocType(d.id as AssetType)}>
              <ArrowUpCircle />
              Quick text/image
            </Button>)

          const items = (
            <div
              data-lenis-prevent-wheel
              className="flex max-h-60 flex-col items-start justify-start gap-1 overflow-y-auto">
              {isLoading
                ? (<div className="p-2 text-xs text-muted-foreground">Loading...</div>)
                : typeAssets.length === 0
                  ? (<div className="p-2 text-xs text-muted-foreground">No {d.id} assets yet</div>)
                  : typeAssets.map(a => (
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
                      </Peekable>))
              }
              {adHocValue
                ? renderAdhoc()
                : renderAdhocTrigger()}
            </div>),
          adhocForm = (
            <div className="flex w-full flex-col gap-1 pr-1">
              <Tabs
                value={adhocTab}
                className="gap-1"
                onValueChange={(v) => {
                  setAdhocTab(v as 'text' | 'image')
                }}>
                <TabsList className="w-full bg-muted p-0! h-5!">
                  <TabsTrigger value="text"
                    className="h-5 flex-1 text-xs border border-transparent! data-[state=active]:border-border! data-[state=active]:shadow-none!">Text</TabsTrigger>
                  <TabsTrigger value="image"
                    className="h-5 flex-1 text-xs border border-transparent! data-[state=active]:border-border! data-[state=active]:shadow-none!">Image</TabsTrigger>
                </TabsList>
                <TabsContent value="text">
                  <Textarea
                    autoFocus
                    rows={4}
                    placeholder={`Describe the ${d.id}...`}
                    value={adhocContent}
                    onChange={e => setAdhocContent(e.target.value)}
                    className="text-xs h-50 rounded-md bg-muted border-none focus-within:ring-0 focus-within:border-input" />
                </TabsContent>
                <TabsContent value="image">
                  <Dropzone
                    value={adhocDataUrl || undefined}
                    onFile={setAdhocDataUrl}
                    onClear={() => setAdhocDataUrl('')}
                    className="aspect-video w-full h-50 rounded-md!" />
                </TabsContent>
              </Tabs>
              <div className="flex items-center gap-1">
                <Button
                  size="icon-sm"
                  className="flex h-5 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={resetAdhoc}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="xs"
                  className="h-5 flex-1"
                  disabled={
                    (adhocTab === 'text' && !adhocContent.trim()) ||
                    (adhocTab === 'image' && !adhocDataUrl)
                  }
                  onClick={() => doneAdhoc(d.id as AssetType)}>
                  Done
                </Button>
              </div>
            </div>)

          return (
            <Popover
              key={d.id}
              modal={false}
              open={openType === d.id}
              onOpenChange={(open) => {
                if (!open) resetAdhoc()
                setOpenType(open ? d.id as AssetType : null)
              }}>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className={cn(
                    'tube group rounded-none h-7 px-2 text-xs',
                    isSelected ? 'on' : ''
                  )}>
                  {d.id}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                side="top"
                sideOffset={0}
                className="draw-up rounded-top glass w-48 border-border p-1 pr-0 ob-4">
                {adhocType === d.id
                  ? adhocForm
                  : items
                }
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
