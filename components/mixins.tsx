import * as React from 'react'
import { Peekable } from '@/components/peekable'
import {
  Button,
  ButtonGroup,
  Toggle,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Badge,
} from '@/components/ui'
import Image from 'next/image'
import { assets as assetDefines } from '@/lib/assets-config'
import type { AdhocAsset, AssetType, MixinsWithAdhoc } from '@/lib/types'
import { assetUrl, cn } from '@/lib/utils'
import { useAssets } from '@/hooks/use-assets'
import { useUploadAsset } from '@/hooks/use-upload-asset'
import { useCreateAsset } from '@/hooks/use-create-asset'
import { ArrowLeft, ArrowUpCircle, Check, MoreHorizontalIcon, X } from 'lucide-react'
import { AssetPreview } from './asset-preview'
import { Textarea } from '@/components/ui/textarea'
import { Dropzone } from '@/components/dropzone'
import { compressImage } from '@/lib/compress-image'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useSingleAsset } from '@/hooks/use-asset'

export interface MixinsHandle {
  resolve: () => Promise<{ [k in AssetType]?: string }>
}

export type MixinsProps = {
  value?: MixinsWithAdhoc
  onChange?: (value: MixinsWithAdhoc) => void
}

export const Mixins = React.forwardRef<MixinsHandle, MixinsProps>(function Mixins(
  { value = {}, onChange },
  ref
) {
  const { data: assets = [], isLoading } = useAssets(),
    { fetch: fetchAsset } = useSingleAsset()

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

  const createAsset = useCreateAsset()
  const { upload: uploadAsset } = useUploadAsset()

  React.useImperativeHandle(ref, () => ({
    resolve: async () => {
      const resolved: { [k in AssetType]?: string } = {}
      for (const [type, entry] of Object.entries(value) as [AssetType, string | AdhocAsset | undefined][]) {
        if (!entry) continue
        if (typeof entry === 'object') {
          if ('content' in entry && entry.content) {
            const asset = await createAsset.mutateAsync({ name: '', type, content: entry.content })
            setAdhocItems({
              ...adhocItems,
              [type]: asset
            })
            resolved[type] = asset.id!
          } else if ('path' in entry && entry.path) {
            const blob = await fetch(entry.path).then(r => r.blob())
            const ext = blob.type.split('/')[1] || 'jpg'
            const file = new File([blob], `adhoc.${ext}`, { type: blob.type })
            const storagePath = await uploadAsset(file, type)
            const asset = await createAsset.mutateAsync({ name: '', type, path: storagePath })
            setAdhocItems({
              ...adhocItems,
              [type]: asset
            })
            resolved[type] = asset.id!
          }
        }
      }
      // return only ad-hoc mixins
      onChange?.({
        ...value,
        ...resolved
      })
      return resolved
    }
  }))

  const [openType, setOpenType] = React.useState<AssetType | null>(null)
  /**controls display ad-hoc form in one of the panel */
  const [adhocing, setAdhocing] = React.useState<AssetType | null>(null)
  const [adhocTab, setAdhocTab] = React.useState<'text' | 'image'>('text')
  const [adhocContent, setAdhocContent] = React.useState('')
  const [adhocPath, setAdhocPath] = React.useState('')
  /**
   * keep track of ad-hoc items (before generation)
   */
  const [adhocItems, setAdhocItems] = React.useState<{[key in AssetType]?: AdhocAsset}>({})

  /**
   * when save button clicked
   * @param type 
   */
  const saveAdhoc = (type: AssetType) => {
    const item = {
      name: '',
      type,
      [adhocTab === 'text' ? 'content' : 'path']: adhocTab === 'text'
        ? adhocContent
        : adhocPath
    }
    setAdhocItems({
      ...adhocItems,
      [type]: item
    })
    onChange?.({ ...value, [type]: item})
    setAdhocing(null)
    setAdhocContent('')
    setAdhocPath('')
  }

  const handleSelect = (type: AssetType, asset: string | AdhocAsset) => {
    const v = { ...value } as MixinsWithAdhoc
    const current = v[type]
    if (typeof current === 'string' && current === asset) {
      delete v[type]
    } else {
      v[type] = asset
    }
    // console.log('----handleSelect', type, asset, v)
    onChange?.(v)
  }

  // recalled ad-hoc mixins
  // When user redo an photo that has an ad-hoc asset, 
  // and all the mixins added to the producer, the ad-hoc assets, like a scene asset, 
  // should be recalled and display as a image at the end of  the <Mixins> items
  const recallAdhocMixins = async () => {
    Object.entries(value).map(async ([type, id]) => {
      const assetOfThisType = assetsByType[type] || []
      if (!assetOfThisType.find(item => item.id === id)) {
        const recalled = await fetchAsset(id as string)
        if (recalled) {
          setAdhocItems({
            ...adhocItems,
            [type]: recalled
          })
        }
      }
    })  
  }

  React.useEffect(() => {
    recallAdhocMixins()
  }, [value])


  return (
    <ButtonGroup className="-mt-px h-7 rounded-none bg-foreground/10">
      {assetDefines
        .filter(t => t.id !== 'face')
        .map(d => {
          const typeAssets = (assetsByType[d.id] || []).filter(a => a.name !== '')
          // console.log('----typeAssets', d.id, typeAssets)
          const isSelected = d.id in value
          const v = adhocItems[d.id as AssetType],
            adhocItem = v
              && typeof v === 'object'
              && v.name === ''
              ? v
              : null

          const renderAdhocItem = () => adhocItem
            ? (<div
              className="relative w-30 h-30 cursor-pointer"
              onClick={() => handleSelect(
                d.id as AssetType, 
                adhocItem.id
                  ? adhocItem.id
                  : adhocItem
              )}>
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
              { (value[d.id] === adhocItem || value[d.id] === adhocItem.id) && (
                <Badge className="absolute top-1 left-1 bg-secondary border border-primary text-primary-foreground">
                  <Check className="text-secondary-foreground" />
                </Badge>
              )}
              <Badge className="absolute top-1 right-1 bg-primary/70 border border-secondary! text-primary-foreground">
                ad-hoc
              </Badge>
              {adhocItem.path
                ? (<Image
                    src={adhocItem.path.startsWith('data:')
                      ? adhocItem.path
                      : assetUrl(adhocItem.path)}
                    width={240}
                    height={240}
                    className="size-30 object-cover rounded-sm border border-border!"
                    alt="ad-hoc" />)
                : <div className="line-clamp-2 px-1 py-1 text-left text-xs rounded-md text-muted-foreground">
                    {adhocItem.content}
                  </div>
              }
            </div>)
          : null

          const renderAdhocTrigger = () => (<Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="mt-1 h-5 w-32 justify-start text-xs text-muted-foreground"
              onClick={() => setAdhocing(d.id as AssetType)}>
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
              {adhocItem
                ? renderAdhocItem()
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
                    value={adhocContent}
                    rows={4}
                    placeholder={`Describe the ${d.id}...`}
                    onChange={e => setAdhocContent(e.target.value)}
                    className="text-xs h-50 rounded-md bg-muted border-none focus-within:ring-0 focus-within:border-input" />
                </TabsContent>
                <TabsContent value="image">
                  <Dropzone
                    value={adhocPath}
                    onFile={async (file) => {
                      const compressed = await compressImage(file)
                      const dataUrl = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader()
                        reader.onload = (e) => resolve(e.target!.result as string)
                        reader.onerror = () => reject(new Error('Failed to read file'))
                        reader.readAsDataURL(compressed)
                      })
                      setAdhocPath(dataUrl)
                    }}
                    onClear={() => setAdhocPath('')}
                    className="aspect-video w-full h-50 rounded-md!" />
                </TabsContent>
              </Tabs>
              <div className="flex items-center gap-1">
                <Button
                  size="icon-sm"
                  className="flex h-5 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setAdhocing(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="xs"
                  className="h-5 flex-1"
                  disabled={
                    adhocItem?.path === '' && adhocItem?.content === ''
                  }
                  onClick={() => saveAdhoc(d.id)}>
                  Save
                </Button>
              </div>
            </div>)

          return (
            <Popover
              key={d.id}
              modal={false}
              open={openType === d.id}
              onOpenChange={(open) => {
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
                {adhocing === d.id
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
})
