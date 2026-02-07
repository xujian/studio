'use client'

import Image from 'next/image'
import * as React from 'react'
import { useState } from 'react'
import { Button, Textarea, Toggle } from '@/components/ui'
import type { AssetType, MomentWithPhotos } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useAssets } from '@/hooks/use-assets'
import { useEngine } from '@/hooks/use-engine'
import { FacePicker } from '../face-picker'
import { Mixins } from './mixins'
import type { Mixins as MixinsType } from '@/lib/types'
import { Loader2, ArrowUp, Plus, GripHorizontal, X } from 'lucide-react'
import { preinitModule } from 'react-dom'

interface ProducerProps {
  className?: string
  onGenerationComplete?: (moment: MomentWithPhotos) => void
}

export function Producer({ className, onGenerationComplete }: ProducerProps) {
  const [momentId, setMomentId] = useState<string>(''),
    [prompt, setPrompt] = useState(''),
    [mixins, setMixins] = useState<MixinsType>({}),
    [reference, setReference] = useState<string>('')


  React.useEffect(() => {
    window.setTimeout(() => {
      setReference('https://rhxlulctluazrpqzooya.supabase.co/storage/v1/object/public/uploads/cd99d106-419b-4ebf-aa09-29e5f6d688d1/b2ee669ac725e671.jpg')
    }, 10000)
  })
  
  /**
   * indicates prompt is modified after the first generation
   */
  const [dirty, setDirty] = useState(false)
  /**
   * User can regenerate photos by the same settings
   * till create new
   */
  const [mode, setMode] = useState<'create' | 'retry'>('create')
  /**
   * the UI mode
   */
  const [expanded, setExpanded] = useState(false)

  // Data
  const { data: assets = [] } = useAssets()
  const { mutate: commit, isPending, error } = useEngine()

  // Handlers
  const handleGenerate = () => {
    if (!prompt.trim()) return
    commit(
      {
        prompt: dirty
          ? ''
          : prompt,
        mixins,
        reference,
        momentId,
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
    setMixins({})
    setDirty(false)
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

  const filterAssets = (type?: AssetType) => {
    if (!type) return assets
    return assets.filter(asset => asset.type === type)
  }

  return (
    <div
      className={cn(
        'producer fixed bottom-4 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2',
        'glass animate-float-up rounded-4xl bg-accent/80',
        'transition-all duration-300',
        className
      )}>
      <div
        className={cn('-mb-7 flex px-8 opacity-0 transition-all duration-300', {
          'mb-0 opacity-100': expanded
        })}>
        <Mixins value={{}} />
      </div>
      <div className="-m-px flex flex-col overflow-hidden rounded-4xl border border-white/50 bg-black/20 p-4 gap">
        <div className="flex items-start gap">
          <div className="h-full w-12"></div>
          {/** the reference image */}
          <div className={cn('reference transtion-all duration-500 rounded overflow-hidden',
              reference ? 'block h-20 w-20 border' : 'h-8 w-8',
              expanded ? 'top-10' : 'top-3'
            )}>
            { reference
              ? (<img className="object-cover h-full w-full"
                  alt="reference"
                  src={reference}
                  width={100}
                  height={100} />)
              : (<Button
                  type="button"
                  variant="outline"
                  className="icon-button"
                  disabled={isPending}>
                  <Plus />
                </Button>)
            }
          </div>
          <div className={cn('flex-1')}>
            <Textarea
              placeholder="Describe the portrait you want to create..."
              className="max-h-24 min-h-12 resize-none border-none rounded-none bg-transparent! focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
              value={prompt}
              onChange={handlePromptChange}
              disabled={isPending}
            />
          </div>
        </div>
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <Toggle
              pressed={expanded}
              type="button"
              variant="outline"
              className="button"
              onClick={toggleExpanded}>
              <GripHorizontal />
            </Toggle>
          </div>
          <div className="flex items-center gap-2">
            {/* New/Clear button (only visible in retry mode) */}
            {mode === 'retry' && (
              <Button
                type="button"
                variant="outline"
                className="icon-button"
                onClick={handleNew}
                disabled={isPending}>
                <X />
              </Button>
            )}

            {/* Generate/Retry button */}
            <Button
              type="button"
              variant="outline"
              className="icon-button"
              onClick={handleGenerate}
              disabled={isPending || !prompt.trim()}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp />
              )}
            </Button>
          </div>
        </div>
      </div>
      {/* Face Picker */}
      <div
        className={cn(
          'absolute left-4 transition-all duration-500',
          expanded ? 'top-10' : 'top-4'
        )}>
        <FacePicker
          faces={filterAssets('face')}
          onSelect={handleFaceSelect}
          selected={mixins.face}
        />
      </div>
      {/* Error display */}
      {error && (
        <div className="absolute top-0 right-0 left-0 rounded-t-4xl bg-destructive p-2 text-sm text-destructive-foreground">
          {error.message}
        </div>
      )}
    </div>
  )
}
