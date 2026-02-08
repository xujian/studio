'use client'

import * as React from 'react'
import { useRef, useState } from 'react'
import { Button, Textarea, Toggle } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import type { AssetType, MomentWithPhotos } from '@/lib/types'
import type { Mixins as MixinsType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useAssets } from '@/hooks/use-assets'
import { useEngine } from '@/hooks/use-engine'
import { FacePicker } from '../face-picker'
import { Mixins } from './mixins'
import { Loader2, ArrowUp, Plus, GripHorizontal, X } from 'lucide-react'

interface ProducerProps {
  className?: string
  onGenerationComplete?: (moment: MomentWithPhotos) => void
}

export function Producer({ className, onGenerationComplete }: ProducerProps) {
  const [momentId, setMomentId] = useState<string>(''),
    [prompt, setPrompt] = useState(''),
    [mixins, setMixins] = useState<MixinsType>({}),
    [reference, setReference] = useState<string>(''),
    [uploading, setUploading] = useState(false),
    [userId, setUserId] = useState('')

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
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

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
  const { mutate: commit, isPending, error, reset: clearError } = useEngine()

  // Handlers
  const handleGenerate = () => {
    if (couldNotSubmit) return
    commit(
      {
        prompt: dirty ? '' : prompt,
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
    setMixins({})
    setReference('')
    setDirty(false)
  }

  /**
   *
   */
  const couldNotSubmit = React.useMemo<boolean>(() => {
    return reference === '' && prompt === ''
  }, [reference, prompt])

  const handleReferenceUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() || 'jpg'
      const bytes = new Uint8Array(8)
      crypto.getRandomValues(bytes)
      const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(''),
        filename = `${hex}.${ext}`,
        path = `${userId}/${filename}`
      const { error } = await supabase.storage
        .from('uploads')
        .upload(path, file, { contentType: file.type, upsert: false })
      if (error) throw error
      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(path)
      setReference(filename)
    } catch (err) {
      console.error('Reference upload failed:', err)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
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

  const filterAssets = (type?: AssetType) => {
    if (!type) return assets
    return assets.filter(asset => asset.type === type)
  }


  return (
    <div
      className={cn(
        'producer fixed bottom-4 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2',
        'glass animate-float-up rounded-4xl bg-accent/80',
        'transition-all duration-300 overflow-hidden',
        className
      )}>
      <div
        className={cn('-mb-7 flex px-8 opacity-0 transition-all duration-300', {
          'mb-0 opacity-100': expanded
        })}>
        <Mixins value={{}} />
      </div>
      <div className="gap -m-px flex flex-col overflow-hidden rounded-4xl border border-white/50 bg-black/20 p-4">
        <div className="gap flex items-start">
          <div className="h-12 w-12"></div>
          {/** the reference image */}
          <div
            className={cn(
              'reference transtion-all relative overflow-hidden rounded duration-500',
              reference
                ? 'h-20 w-20 border'
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
                    <img
                      className="h-full w-full object-cover"
                      alt="reference"
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${userId}/${reference}`}
                      width={100}
                      height={100}
                    />
                    <button
                      type="button"
                      className="absolute top-0 right-0 rounded-bl bg-black/60 p-0.5 text-white hover:bg-black/80"
                      onClick={handleReferenceClear}>
                      <X className="h-3 w-3" />
                    </button>
                  </>
                )
              : (
                  <Button
                    type="button"
                    variant="outline"
                    className="icon-button"
                    disabled={isPending || uploading}
                    onClick={() => fileInputRef.current?.click()}>
                    {uploading
                      ? (<Loader2 className="h-4 w-4 animate-spin" />)
                      : (<Plus />)}
                  </Button>
                )}
          </div>
          <div className={cn('flex-1')}>
            <Textarea
              placeholder="Describe the portrait you want to create..."
              className="max-h-24 min-h-12 resize-none rounded-none border-none bg-transparent! p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
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
              disabled={isPending || couldNotSubmit}>
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
      <div className={cn([
          'absolute glass flex items-center justify-between bottom-0 right-0 left-0 rounded-full',
          'bg-destructive/80! text-xs h-14 p-2 pl-4',
          'text-destructive-foreground',
          error ? 'translate-y-0' : 'translate-y-full',
        ].join(' '))}>
        {error && error.message}
        <Button className="icon-button" onClick={clearError}>
          <X />
        </Button>
      </div>
    </div>
  )
}
