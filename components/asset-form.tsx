'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/button'
import { CreditButton } from '@/components/credit-button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Upload, type UploadHandle } from '@/components/upload'
import type { Asset, AssetRunMode, AssetType, AssetWorkMode } from '@/lib/types'
import { useCreateAsset } from '@/hooks/use-create-asset'
import { useUpdateAsset } from '@/hooks/use-update-asset'
import { assetUrl } from '@/lib/utils'
import { ArrowDownUp, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Hint } from './ui'

const uploadPlaceholders: Record<AssetType, string> = {
  face: 'Upload your photo with clear face',
  hair: 'Upload an reference image of the hairstyle',
  outfit: 'Upload a reference image of the outfit',
  makeup: 'Upload an reference image of the makeup',
  scene: 'Upload an reference image of the scene',
  lighting: 'Upload an image representing the lighting',
  camera: 'Upload an image representing the lighting',
  mood: 'Upload an image representing the lighting'
}

const contentPlaceholders: Record<AssetType, string> = {
  face: '',
  hair: 'Describe the hairstyle (e.g. long wavy hair, dark brown)',
  outfit: 'Describe the outfit (e.g. light linen pants, white crop top)',
  makeup: 'Describe the makeup (e.g. natural makeup with a focus on eyes)',
  scene: 'Describe the scene (e.g. urban street with graffiti walls)',
  lighting: 'Describe the lighting (e.g. soft warm light from the right)',
  camera: 'Describe the camera style (e.g. shallow depth of field, close-up)',
  mood: 'Describe the mood (e.g. vibrant and energetic)'
}

const assetModes: Record<AssetType, AssetWorkMode> = {
  face: 'image-only',
  hair: 'text-first',
  outfit: 'text-first',
  makeup: 'text-first',
  scene: 'text-first',
  lighting: 'text-only',
  camera: 'text-only',
  mood: 'text-only'
}

type AssetFormProps = {
  type: AssetType
  asset?: Asset
  onClose: () => void
}

export function AssetForm({ type, asset, onClose }: AssetFormProps) {
  const uploadRef = useRef<UploadHandle>(null)
  const createAsset = useCreateAsset()
  const updateAsset = useUpdateAsset()
  const isEditing = !!asset

  const [uploadedPath, setUploadedPath] = useState<string>('')
  const savedRef = useRef(false)
  const uploadedPathRef = useRef('')

  useEffect(() => {
    uploadedPathRef.current = uploadedPath
  }, [uploadedPath])

  // Cleanup newly-uploaded (unsaved) image on unmount
  useEffect(() => {
    return () => {
      if (uploadedPathRef.current && !savedRef.current) {
        createClient().storage.from('assets').remove([uploadedPathRef.current])
      }
    }
  }, [])

  const [name, setName] = useState(asset?.name ?? '')
  const [title, setTitle] = useState(asset?.title ?? '')
  const [description, setDescription] = useState(asset?.description ?? '')
  const [content, setContent] = useState(asset?.content ?? '')
  const [suggesting, setSuggesting] = useState(false)
  const assetMode = assetModes[type]

  const [runMode, setRunMode] = useState<AssetRunMode>(
    assetMode === 'image-only'
      ? 'image'
      : asset?.path
        ? 'image'
        : 'text'
  )

  const toggleWorkMode = () => {
    setRunMode(runMode === 'text' ? 'image' : 'text')
  }

  const handleSuggest = async () => {
    if (!uploadedPath && !content) return
    setSuggesting(true)
    try {
      const res = await fetch('/api/assets/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          content: content || undefined,
          storagePath: uploadedPath || undefined
        })
      })
      if (res.ok) {
        const data = await res.json()
        setName(data.name || '')
        setTitle(data.title || '')
      }
    } finally {
      setSuggesting(false)
    }
  }

  const handleSave = () => {
    if (isEditing) {
      const pathToSave = uploadedPath || asset.path || null
      updateAsset.mutate(
        { id: asset.id!, name, title, description, content, type, path: pathToSave },
        {
          onSuccess: () => {
            // Delete old image from storage if it was replaced
            if (uploadedPath && asset.path && uploadedPath !== asset.path) {
              createClient().storage.from('assets').remove([asset.path])
            }
            savedRef.current = true
            onClose()
          }
        }
      )
    } else {
      createAsset.mutate(
        { name, title, description, content, type, path: uploadedPath },
        {
          onSuccess: () => {
            savedRef.current = true
            resetForm()
            onClose()
          }
        }
      )
    }
  }

  const handleCancel = async () => {
    savedRef.current = true
    await uploadRef.current?.clear()
    if (!isEditing) resetForm()
    onClose()
  }

  const resetForm = () => {
    setUploadedPath('')
    setName('')
    setTitle('')
    setDescription('')
    setContent('')
  }

  const canSuggest = (!!uploadedPath || !!content) && !suggesting
  const isPending = createAsset.isPending || updateAsset.isPending
  const canSave = !!name && !isPending

  return (
    <div className="asset-create flex min-h-full flex-col gap-2 p-2">
      <div className={cn('flex flex-col items-center gap-2',
        runMode === 'image' && 'flex-col-reverse'
        )}>
        {assetMode !== 'image-only' && (
          <Textarea label="Content"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={contentPlaceholders[type]}
            disabled={runMode === 'image'}
            rows={3}>
              { content.length > 0 && (
              <CreditButton
                cost={1}
                type="button"
                variant="outline"
                size="xs"
                onClick={handleSuggest}
                disabled={suggesting}
                className="absolute bottom-1 right-1 gap-2 self-start">
                {suggesting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                Generate preview image
              </CreditButton>)}
            </Textarea>)
        }
        <Upload
          ref={uploadRef}
          className="aspect-square"
          path={({ userId }) => `assets/${userId}/${type}`}
          initialPreview={asset?.path ? assetUrl(asset.path) : undefined}
          placeholder={
            runMode === 'text'
              ? `Upload preview image (optional)`
              : uploadPlaceholders[type]
          }
          onComplete={setUploadedPath}>
          {assetMode === 'text-first' && (
            <Button variant="outline" size="xs"
              className="absolute bg-muted/50 top-1 right-1 z-1"
              onClick={toggleWorkMode}>
              <ArrowDownUp className="size-4" />
              { runMode === 'text'
                ? 'Use image as reference'
                : 'Input as text prompt' }
            </Button>
          )}
          <Hint variant="tooltip"
            className="absolute bottom-1 left-1 z-1 max-w-[200px]">
            {runMode === 'text'
              ? 'Upload an image to use as reference for this asset. It can be used as a hint for AI generation or just for your own reference.'
              : 'Describe the asset in text. This can be used as a prompt for AI generation or just as a note for yourself.'}
          </Hint>
        </Upload>
      </div>
      <Input
        id="asset-name"
        label="Name"
        required
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="e.g. summer-casual">
        {canSuggest && (
          <CreditButton
            cost={1}
            type="button"
            variant="outline"
            size="xs"
            onClick={handleSuggest}
            disabled={suggesting}
            className="absolute bottom-1 right-1 gap-2 self-start">
            {suggesting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            Suggest name &amp; title
          </CreditButton>)
        }
      </Input>
      <Input
        label="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="e.g. Summer Casual" />
      <Input
        label='Description'
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="A note for yourself" />
      <div className="flex flex-1 items-end gap-2 pt-2">
        <Button
          variant="outline"
          className="flex-1"
          size="sm"
          onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          className="flex-1"
          size="sm"
          onClick={handleSave}
          disabled={!canSave}>
          {isPending && (
            <Loader2 className="mr-2 size-4 animate-spin" />
          )}
          {isEditing ? 'Update' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
