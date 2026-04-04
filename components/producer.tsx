'use client'

import * as React from 'react'
import { useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Textarea, Toggle, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui'
import { Button } from '@/components/button'
import { createClient } from '@/lib/supabase/client'
import type { AdhocAsset, AssetType, Mixins as MixinsType, MixinsWithAdhoc, MomentWithPhotos } from '@/lib/types'
import { useBus, type MixinSelectPayload } from '@/lib/bus'
import { cn } from '@/lib/utils'
import { useAssets } from '@/hooks/use-assets'
import { useEngine } from '@/hooks/use-engine'
import { useUpload } from '@/hooks/use-upload'
import { useCreateAsset } from '@/hooks/use-create-asset'
import { compressImage } from '@/lib/compress-image'
import { FacePicker } from '@/components/face-picker'
import { Mixins } from '@/components/mixins'
import { Loader2, ArrowUp, Plus, GripHorizontal, X, Square, RotateCcw } from 'lucide-react'

interface ProducerProps {
  className?: string
  onGenerationComplete?: (moment: MomentWithPhotos) => void
}

export function Producer({ className, onGenerationComplete }: ProducerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const [momentId, setMomentId] = useState<string>(''),
    [prompt, setPrompt] = useState(''),
    [mixins, setMixins] = useState<MixinsWithAdhoc>({}),
    [reference, setReference] = useState<string>(''),
    [userId, setUserId] = useState(''),
    /**
     * indicates prompt is modified after the first generation
     */
    [dirty, setDirty] = useState(false),
    /**
     * User can regenerate photos by the same settings
     * till create new
     */
    [mode, setMode] = useState<'create' | 'retry'>('create'),
    /**
     * the UI mode
     */
    [expanded, setExpanded] = useState(false)

  // Pre-apply asset from store "Use" button (?use=assetId&type=assetType)
  React.useEffect(() => {
    const useId = searchParams.get('use')
    const useType = searchParams.get('type')
    if (useId && useType) {
      setMixins(prev => ({ ...prev, [useType]: useId }))
      router.replace('/studio')
    }
  }, [searchParams])

  React.useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (!data) {
        throw new Error('Not authenticated')
      } else {
        if (data.session) {
          setUserId(data.session.user.id)
        }
      }
    })
  }, [])

  const $bus = useBus()

  // Listen for settings loaded from MomentView
  $bus.on('moment:resume', (payload) => {
    setMomentId(payload.momentId)
    setPrompt(payload.prompt)
    setMixins(payload.mixins)
    setReference(payload.reference || '')
    setMode('retry')
    setDirty(false)
  })

  $bus.on('mixin:select', (payload: MixinSelectPayload) => {
    setMixins(prev => ({ ...prev, [payload.type]: payload.assetId }))
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Data
  const { data: assets = [] } = useAssets()
  const { mutate: commit, isPending, error, reset: clearError } = useEngine()
  const [resolutionError, setResolutionError] = React.useState<string | null>(null)
  const createAsset = useCreateAsset()
  const { upload, uploading, remove } = useUpload({
    path: () => `uploads/${userId}`
  })

  const uploadFileAsync = (file: File): Promise<{ storagePath: string }> =>
    new Promise((resolve, reject) => {
      upload(file, {
        onSuccess: resolve,
        onError: () => reject(new Error('Upload failed')),
      })
    })

  // Handlers
  const handleGenerate = async () => {
    if (couldNotSubmit) return
    setResolutionError(null)

    // Resolve any inline ad-hoc entries to real asset IDs before generation
    const resolvedMixins: { [k in AssetType]?: string } = {}
    try {
      for (const [type, entry] of Object.entries(mixins) as [AssetType, string | AdhocAsset | undefined][]) {
        if (!entry) continue
        if (typeof entry === 'string') {
          resolvedMixins[type] = entry
        } else if ('content' in entry) {
          const asset = await createAsset.mutateAsync({
            name: '',
            type,
            content: (entry as { content: string }).content,
          })
          resolvedMixins[type] = asset.id!
        } else if ('path' in entry && entry.path) {
          const blob = await fetch(entry.path).then(r => r.blob())
          const ext = blob.type.split('/')[1] || 'jpg'
          const file = new File([blob], `adhoc.${ext}`, { type: blob.type })
          const { storagePath } = await uploadFileAsync(file)
          const asset = await createAsset.mutateAsync({ name: '', type, path: storagePath })
          resolvedMixins[type] = asset.id!
        }
      }
    } catch {
      setResolutionError('Failed to save ad-hoc content. Please try again.')
      return
    }

    commit(
      {
        prompt: mode === 'create'
          ? prompt
          : dirty
            ? prompt
            : '',
        mixins: resolvedMixins,
        reference,
        momentId,
      },
      {
        onSuccess: moment => {
          setMomentId(moment.id)
          setMode('retry')
          setDirty(false)
          onGenerationComplete?.(moment)
        }
      }
    )
  }

  const handleNew = () => {
    setMomentId('')
    setMode('create')
    setPrompt('')
    setMixins({
      face: mixins.face
    })
    setReference('')
    setDirty(false)
  }

  /**
   * Disable submit if both reference and prompt are empty.
   */
  const couldNotSubmit = reference === '' && prompt === ''

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    upload(file, {
      onSuccess: ({ filename }) => setReference(filename),
      onSettled: () => {
        if (fileInputRef.current) fileInputRef.current.value = ''
      },
    })
  }

  const handleReferenceClear = () => {
    if (reference) remove('uploads', `${userId}/${reference}`)
    setReference('')
  }

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value)
    // Only track edits in retry mode
    if (mode === 'retry') {
      setDirty(true)
    }
  }

  const handleFaceSelect = (faceId: string) => {
    setMixins({
      ...mixins,
      face: faceId
    })
  }

  const toggleExpanded = () => {
    setExpanded(!expanded)
  }

  const handleTextareaPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const file = Array.from(e.clipboardData.items)
      .find(item => item.type.startsWith('image/'))
      ?.getAsFile()
    if (!file) return
    e.preventDefault()
    compressImage(file).then(compressed => {
      upload(compressed, {
        onSuccess: ({ filename }) => setReference(filename),
      })
    })
  }

  const handleTextareaWheel = (e: React.WheelEvent<HTMLTextAreaElement>) => {
    const el = textareaRef.current
    if (!el) return
    const isAtTop = el.scrollTop <= 0
    const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1 // -1 容错
    const scrollingUp = e.deltaY < 0
    const scrollingDown = e.deltaY > 0
    if (
      (scrollingDown && !isAtBottom) ||
      (scrollingUp && !isAtTop)
    ) {
      return
    }
    e.preventDefault()
    e.stopPropagation()
  }

const filterAssets = (type?: AssetType) => {
    if (!type) return assets
    return assets.filter(asset => asset.type === type)
  }


  return (
    <div data-lenis-prevent-wheel className={cn(
        'producer fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2',
        'glass animate-float-up rounded-3xl bg-accent/80',
        'transition-all duration-300 overflow-hidden',
        className
      )}>
      <div className={cn(
          'overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out',
          expanded ? 'max-h-14 opacity-100' : 'max-h-0 opacity-0'
        )}>
        <div className="flex px-8">
          <Mixins value={mixins} onChange={setMixins} />
        </div>
      </div>
      <div className="relative -m-px overflow-hidden rounded-3xl border border-foreground/50 bg-background/20 p-1">
        <div className="inputs min-h-32 gap-1 flex items-stretch">
          <div className="h-18 w-18"></div>
          <div className={cn(
              'reference relative transition-[width,height] duration-300',
              reference
                ? 'h-40 w-32 border overflow-hidden rounded-xl'
                : 'h-9 w-9'
            )}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleReferenceUpload}
            />
            {reference
              ? (
                  <>
                    <Image
                      className="h-full w-full object-cover"
                      alt="reference"
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${userId}/${reference}`}
                      fill
                      sizes="100px"
                    />
                    <Button
                      type="button"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/60 text-foreground hover:bg-background/80"
                      onClick={handleReferenceClear}>
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                )
              : (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-lg"
                    tooltip="Upload reference image"
                    className="button"
                    disabled={isPending || uploading}
                    onClick={() => fileInputRef.current?.click()}>
                    {uploading
                      ? (<Loader2 className="h-4 w-4 animate-spin" />)
                      : (<Plus />)}
                  </Button>
                )}
          </div>
          <div className={cn('flex-1 p-0 h-full')}>
            <Textarea
              ref={textareaRef}
              data-lenis-prevent-wheel
              aria-label="Portrait description"
              placeholder="Describe the portrait you want to create..."
              className={cn(
                'min-h-32 max-h-40 h-full text-xs resize-none rounded-none border-none shadow-none bg-transparent!',
                'p-0 focus-visible:outline-none focus-visible:ring-0 focus-within:ring-0 focus-within:border-transparent',
                '[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full',
                '[&::-webkit-scrollbar-thumb]:bg-white/20',
                '[&::-webkit-scrollbar-track]:bg-transparent')}
              value={prompt}
              onChange={handlePromptChange}
              onPaste={handleTextareaPaste}
              onWheel={handleTextareaWheel}
              disabled={isPending}
            />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 p-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <div>{/** to fix the toggle's state=closed problem */}
                <Toggle
                  pressed={expanded}
                  type="button"
                  variant="outline"
                  className="rounded-xl h-10 w-18 data-[state=on]:bg-primary! data-[state=on]:text-primary-foreground"
                  onClick={toggleExpanded}>
                  <GripHorizontal />
                </Toggle>
              </div>
            </TooltipTrigger>
            <TooltipContent align='center' side="top" sideOffset={10}>
              mixins
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="absolute bottom-0 right-0 p-1 flex gap-1">
          {/* New/Clear button (only visible in retry mode) */}
          {mode === 'retry' && (
            <Button
              type="button"
              variant="default"
              tooltip="retry"
              className="h-10 w-10 rounded-xl"
              onClick={handleNew}
              disabled={isPending}>
              <X />
            </Button>
          )}
          {/* Generate/Retry button */}
          <Button
            type="button"
            variant="default"
            className="h-10 w-10 rounded-xl"
            tooltip="generate"
            onClick={handleGenerate}
            disabled={isPending || couldNotSubmit}>
            {isPending
              ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )
              : mode === 'create'
                ? (<ArrowUp />)
                : (<RotateCcw />)
            }
          </Button>
        </div>
      </div>
      {/* Face Picker */}
      <div
        className={cn(
          'absolute left-1 transition-all duration-500',
          expanded ? 'top-8' : 'top-1'
        )}>
        <FacePicker
          faces={filterAssets('face')}
          onSelect={handleFaceSelect}
          selected={mixins.face as string | undefined}
        />
      </div>
      <div
        role="alert"
        aria-live="assertive"
        className={cn([
          'error absolute flex items-center justify-between bottom-0 right-0 left-0 rounded-full',
          'h-12 p-2 pl-4 backdrop-blur-md duration-500',
          error || resolutionError ? 'translate-y-0' : 'translate-y-full',
        ].join(' '))}>
        {resolutionError
          ? <p className="text-xs text-destructive">{resolutionError}</p>
          : error && error.message
        }
        <Button size="icon-lg" className="absolute top-1 right-1" aria-label="Dismiss error" onClick={() => { clearError(); setResolutionError(null) }}>
          <X />
        </Button>
      </div>
      <div className={cn('pulse', isPending ? 'on' : 'off')} aria-live="polite">
        {isPending && <span className="sr-only">Generating portrait...</span>}
        <Button size="icon-lg" className="absolute top-1 right-1 icon-button" tooltip="stop" aria-label="Stop generation">
          <Square />
        </Button>
      </div>
    </div>
  )
}
