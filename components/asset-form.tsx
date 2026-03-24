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
import { ArrowDown, ArrowDownUp, ArrowUp, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge, Hint } from './ui'
import { useQueryClient } from '@tanstack/react-query'
import { CloseButton } from './close-button'

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

/**
 * Create or Edit Asset
 * @param
 * @returns 
 */
export function AssetForm({ type, asset, onClose }: AssetFormProps) {
  const uploadRef = useRef<UploadHandle>(null)
  const createAsset = useCreateAsset()
  const updateAsset = useUpdateAsset()
  const queryClient = useQueryClient()
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
  const [price, setPrice] = useState<string>(asset?.price != null ? String(asset.price) : '')
  const hasPrice = !!asset && asset.user_id == null
  const [suggesting, setSuggesting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const assetMode = assetModes[type]

  const [runMode, setRunMode] = useState<AssetRunMode>(
    assetMode === 'image-only'
      ? 'image'
      : asset
        ? asset.content
          ? 'text'
          : 'image'
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

  const handleGeneratePreview = async () => {
    if ((!content && !uploadedPath) || generating) return
    setGenerating(true)
    setPreviewError('')
    try {
      const res = await fetch('/api/assets/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          content: content || undefined,
          image: uploadedPath || undefined,
        })
      })
      if (res.ok) {
        const data = await res.json()
        console.log('preview//////////data', data)
        const url = assetUrl(data.storagePath)
        uploadRef.current?.setPreview(url, data.storagePath)
        setUploadedPath(data.storagePath)
        setGenerated(true)
        if (data.title && !title) setTitle(data.title)
        if (data.slug && !name) setName(data.slug)
        if (data.description && !description) setDescription(data.description)
        queryClient.invalidateQueries({ queryKey: ['profile'] })
      } else {
        const data = await res.json()
        setPreviewError(data.error || 'Generation failed')
      }
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = () => {
    if (isEditing) {
      const pathToSave = uploadedPath || asset.path || null
      const parsedPrice = price !== '' ? parseInt(price, 10) : null
      updateAsset.mutate(
        {
          id: asset.id!,
          name,
          title,
          description,
          content,
          type,
          path: pathToSave,
          price: parsedPrice
        },
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
    setGenerated(false)
  }

  const canSuggest = (!!uploadedPath || !!content) && !suggesting
  const isPending = createAsset.isPending || updateAsset.isPending
  const canSave = !!name && !isPending

  const handlePaste = (e: React.ClipboardEvent) => {
    const file = Array.from(e.clipboardData.items)
      .find(item => item.type.startsWith('image/'))
      ?.getAsFile()
    if (file) {
      e.preventDefault()
      uploadRef.current?.upload(file)
    }
  }

  return (
    <div className="asset-create flex min-h-full flex-col gap-2 p-2" onPaste={handlePaste}>
      <div className={cn('flex flex-col items-center gap-2',
        runMode === 'image' && 'flex-col-reverse'
        )}>
        {assetMode !== 'image-only' && (
          <Textarea label="Prompt Text"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={contentPlaceholders[type]}
            disabled={runMode === 'image'}
            className="overflow-hidden"
            rows={3}>
              { content.length > 0 && !generated && (
                <CreditButton
                  cost={1}
                  type="button"
                  size="xs"
                  onClick={handleGeneratePreview}
                  disabled={generating}
                  className="absolute bottom-1 right-1 gap-2 self-start">
                  {generating ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )}
                  Generate preview image
                </CreditButton>)}
              <div className={cn('error absolute left-0 w-full h-full rounded-2xl p-4 transition-top duration-300 backdrop-blur-md',
                  previewError ? 'top-0' : 'top-full'
                )}>
                <CloseButton onClick={() => setPreviewError('')} />
                {previewError}
              </div>
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
          onComplete={(path) => {
            if (uploadedPath && uploadedPath !== path) {
              createClient().storage.from('assets').remove([uploadedPath])
            }
            setUploadedPath(path)
            setGenerated(false)
          }}>
          <Badge variant="ghost"
            className="absolute top-2 left-2 text-xs font-medium bg-neutral text-neutral-foreground z-1">
            { runMode === 'text'
              ? 'Preview (optional)'
              : 'Reference image' }
          </Badge>
          <div className="absolute bottom-1 right-1 flex items-center gap-1">
            {uploadedPath && !generated && (
              <CreditButton
                cost={1}
                type="button"
                size="xs"
                onClick={handleGeneratePreview}
                disabled={generating}
                className="bg-muted z-1 gap-2">
                {generating ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                Extract preview
              </CreditButton>
            )}
            {assetMode === 'text-first' && (
              <Button variant="outline" size="xs"
                className="bg-muted z-1"
                tooltip={runMode === 'text'
                  ? 'Use the uploaded image as a reference for this asset'
                  : 'Use the text content as a prompt for this asset'}
                onClick={toggleWorkMode}>
                { runMode === 'text'
                  ? <ArrowUp className="size-4" />
                  : <ArrowDown className="size-4" />
                }
                { runMode === 'text'
                  ? 'Use image as reference'
                  : 'Input as text prompt' }
              </Button>)
            }
          </div>
          <Hint variant="tooltip"
            className="absolute bottom-1 left-1 z-1 max-w-50">
            {runMode === 'text'
              ? 'Upload an image to use as reference for this asset. It can be used as a hint for AI generation or just for your own reference.'
              : 'Describe the asset in text. This can be used as a prompt for AI generation or just as a note for yourself.'}
          </Hint>
        </Upload>
      </div>
      <Input
        label="Name"
        required
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="e.g. summer-casual">
        {canSuggest && (
          <CreditButton
            cost={1}
            type="button"
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
      {hasPrice && (
        <Input
          label="Price (credits)"
          type="number"
          min="0"
          value={price}
          onChange={e => setPrice(e.target.value)}
          placeholder="Leave empty for free" />
      )}
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
