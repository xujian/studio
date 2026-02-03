'use client'

import * as React from 'react'
import { useState } from 'react'
import {
  Button,
  Textarea,
  Toggle,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import { Mixins } from './mixins'
import {
  Loader2,
  ArrowUp,
  Plus,
  GripHorizontal,
  X
} from 'lucide-react'
import { FacePicker } from '../face-picker'
import { useAssets } from '@/hooks/use-assets'
import { useEngine } from '@/hooks/use-engine'
import type { AssetType, MomentWithPhotos } from '@/lib/types'

interface ProducerProps {
  className?: string
  onGenerationComplete?: (moment: MomentWithPhotos) => void
}

export function Producer ({
  className,
  onGenerationComplete
}: ProducerProps) {
  // State
  const [selectedFaceId, setSelectedFaceId] = useState<string>('')
  const [currentMomentId, setCurrentMomentId] = useState<string>('')
  const [prompt, setPrompt] = useState('')
  const [promptEdited, setPromptEdited] = useState(false)
  const [mode, setMode] = useState<'generate' | 'retry'>('generate')
  const [expanded, setExpanded] = useState(false)

  // Data
  const { data: assets = [] } = useAssets()
  const { mutate, isPending, error } = useEngine()

  // Handlers
  const handleGenerate = () => {
    if (!prompt.trim()) return

    mutate({
      prompt,
      mixins: selectedFaceId ? { face: selectedFaceId } : undefined,
      moment: currentMomentId || undefined,
      promptEdited: mode === 'retry' ? promptEdited : undefined
    }, {
      onSuccess: (moment) => {
        setCurrentMomentId(moment.id)
        setMode('retry')
        setPromptEdited(false) // Reset after successful generation
        onGenerationComplete?.(moment)
      }
    })
  }

  const handleNew = () => {
    setCurrentMomentId('')
    setMode('generate')
    setPrompt('')
    setSelectedFaceId('')
    setPromptEdited(false)
  }

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value)
    // Only track edits in retry mode
    if (mode === 'retry') {
      setPromptEdited(true)
    }
  }

  const handleFaceSelect = (faceId: string) => {
    setSelectedFaceId(faceId)
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
      <div className="-m-px flex flex-col rounded-4xl border border-white/50 bg-black/20 p-4 overflow-hidden">
        <div className="flex-1 rounded">
          <Textarea
            placeholder="Describe the portrait you want to create..."
            className="min-h-12 max-h-24 resize-none border-none bg-transparent! focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{
              marginLeft: '48px',
            }}
            value={prompt}
            onChange={handlePromptChange}
            disabled={isPending}
          />
        </div>
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="icon-button"
              disabled={isPending}>
              <Plus />
            </Button>
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
      <div className="absolute h-12 bottom-26 left-3">
        <FacePicker
          faces={filterAssets('face')}
          onSelect={handleFaceSelect}
          selected={selectedFaceId}
        />
      </div>

      {/* Error display */}
      {error && (
        <div className="absolute top-0 left-0 right-0 p-2 bg-destructive text-destructive-foreground text-sm rounded-t-4xl">
          {error.message}
        </div>
      )}
    </div>
  )
}
