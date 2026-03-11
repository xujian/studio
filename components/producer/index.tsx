'use client'

import * as React from 'react'
import { useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Textarea, Toggle, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui'
import { Button } from '@/components/button'
import { createClient } from '@/lib/supabase/client'
import type { AssetType, MomentWithPhotos } from '@/lib/types'
import type { Mixins as MixinsType } from '@/lib/types'
import { useBus, type MixinSelectPayload } from '@/lib/bus'
import { cn } from '@/lib/utils'
import { useAssets } from '@/hooks/use-assets'
import { useEngine } from '@/hooks/use-engine'
import { useUpload } from '@/hooks/use-upload'
import { FacePicker } from '../face-picker'
import { Mixins } from './mixins'
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
    [mixins, setMixins] = useState<MixinsType>({}),
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
  const { upload, uploading } = useUpload({
    path: () => `uploads/${userId}`
  })

  // Handlers
  const handleGenerate = () => {
    if (couldNotSubmit) return
    commit(
      {
        prompt: mode === 'create'
          ? prompt
          : dirty
            ? prompt
            : '',
        mixins,
        reference,
        momentId
      },
      {
        onSuccess: moment => {
          setMomentId(moment.id)
          setMode('retry')
          setDirty(false) // Reset after successful generation
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
    <div className={cn(
        'producer fixed bottom-4 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2',
        'glass animate-float-up rounded-2xl bg-accent/80',
        'transition-all duration-300 overflow-hidden',
        className
      )}>
      <div className={cn('-mb-7 flex px-8 opacity-0 transition-all duration-300',
          expanded ? 'mb-0 opacity-100' : ''
        )}>
        <Mixins value={mixins} onChange={setMixins} />
      </div>
      <div className="relative -m-px overflow-hidden rounded-2xl border border-white/50 bg-black/20 p-1">
        <div className="inputs min-h-32 gap-1 flex items-stretch">
          <div className="h-18 w-18"></div>
          {/** the reference image */}
          <div className={cn(
              'reference transtion-all relative overflow-hidden rounded-xl duration-500',
              reference
                ? 'h-40 w-32 border'
                : 'h-8 w-8'
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
                      className="absolute top-1 right-1 h-4 w-4 rounded-full bg-black/60 text-white hover:bg-black/80"
                      onClick={handleReferenceClear}>
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                )
              : (
                  <Button
                    type="button"
                    variant="outline"
                    tooltip="Upload reference image"
                    className="icon-button"
                    disabled={isPending || uploading}
                    onClick={() => fileInputRef.current?.click()}>
                    {uploading
                      ? (<Loader2 className="h-4 w-4 animate-spin" />)
                      : (<Plus />)}
                  </Button>
                )}
          </div>
          <div className={cn('flex-1 p-1 pr-0 h-full')}>
            <Textarea
              ref={textareaRef}
              data-lenis-prevent-wheel
              placeholder="Describe the portrait you want to create..."
              className={cn([
                'min-h-32 max-h-40 h-full text-xs resize-none rounded-none border-none bg-transparent!',
                'p-0 focus-visible:ring-0 focus-visible:ring-offset-0',
                '[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent'].join(' '))}
              value={prompt}
              onChange={handlePromptChange}
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
              variant="outline"
              tooltip="retry"
              className="h-10 w-10 rounded-xl bg-primary! text-primary-foreground"
              onClick={handleNew}
              disabled={isPending}>
              <X />
            </Button>
          )}
          {/* Generate/Retry button */}
          <Button
            type="button"
            variant="outline"
            className="h-10 w-10 rounded-xl bg-primary! text-primary-foreground"
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
          selected={mixins.face}
        />
      </div>
      {/* Error display */}
      <div className={cn([
          'absolute glass flex items-center justify-between bottom-0 right-0 left-0 rounded-full',
          'bg-destructive/80! text-xs h-12 p-2 pl-4',
          'text-destructive-foreground',
          error ? 'translate-y-0' : 'translate-y-full',
        ].join(' '))}>
        {error && error.message}
        <Button className="absolute top-2 right-2 icon-button" onClick={clearError}>
          <X />
        </Button>
      </div>
      <div className={cn('pulse', isPending ? 'on' : 'off')}>
        <Button className="absolute top-4 right-4 icon-button" tooltip="stop">
          <Square />
        </Button>
      </div>
    </div>
  )
}
