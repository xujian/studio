'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/button'
import { CreditButton } from '@/components/credit-button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Upload, type UploadHandle } from '@/components/upload'
import type { Asset, AssetRunMode, AssetType } from '@/lib/types'
import { useCreateAsset } from '@/hooks/use-create-asset'
import { useUpdateAsset } from '@/hooks/use-update-asset'
import { assetUrl } from '@/lib/utils'
import { assetModes } from '@/lib/assets-config'
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

  const [uploaded, setUploaded] = useState<string>('')
  const savedRef = useRef(false)
  const uploadedRef = useRef('')
  // Stores the source image as a data URL for redo:
  // - non-face: the compressed file from the initial upload (set via onFile)
  // - face: the cropped result from the first extraction (set on "cropped" SSE event)
  const originalImage = useRef('')

  useEffect(() => {
    uploadedRef.current = uploaded
  }, [uploaded])

  // Cleanup newly-uploaded (unsaved) image on unmount
  useEffect(() => {
    return () => {
      if (uploadedRef.current && !savedRef.current) {
        createClient().storage.from('assets').remove([uploadedRef.current])
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
  const [previewing, setPreviewing] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [extracted, setExtracted] = useState('')
  const [previewError, setPreviewError] = useState('')
  const [extractError, setExtractError] = useState('')
  const assetMode = assetModes[type]

  const [cleared, setCleared] = useState(false)

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

  // Cache the uploaded file as base64 so we can redo extraction without re-fetching from storage.
  // For face, sourceRef is later overwritten with the cropped result from the "cropped" SSE event.
  const setOriginalImage = (file: File) => {
    const reader = new FileReader()
    reader.onload = e => { 
      originalImage.current = (e.target?.result as string) ?? '' 
    }
    reader.readAsDataURL(file)
  }

  const handleSuggest = async () => {
    if (!uploaded && !content) return
    setSuggesting(true)
    try {
      const res = await fetch('/api/assets/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          content: content || undefined,
          storagePath: uploaded || undefined
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

  const handlePreview = async () => {
    if (!content || previewing) return
    setPreviewing(true)
    setPreviewError('')
    try {
      const res = await fetch('/api/assets/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content })
      })
      if (!res.ok) {
        const data = await res.json()
        setPreviewError(data.error || 'Generation failed')
        return
      }
      const data = await res.json()
      if (uploaded && uploaded !== data.storagePath) {
        createClient().storage.from('assets').remove([uploaded])
      }
      setUploaded(data.storagePath)
      setGenerated(true)
      if (data.title && !title) setTitle(data.title)
      if (data.slug && !name) setName(data.slug)
      if (data.description && !description) setDescription(data.description)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    } finally {
      setPreviewing(false)
    }
  }

  const handleExtract = async () => {
    if (!uploaded || extracting) return
    setExtracting(true)
    setExtractError('')
    try {
      const body = { type, image: originalImage.current || uploaded }
      const res = await fetch('/api/assets/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const data = await res.json()
        setExtractError(data.error || 'Extraction failed')
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const chunks = buffer.split('\n\n')
        buffer = chunks.pop() ?? ''

        for (const chunk of chunks) {
          if (!chunk.startsWith('data: ')) continue
          const event = JSON.parse(chunk.slice(6))
          console.log('extractevent---------------', event)

          if (event.type === 'error') {
            setExtractError(event.error)
            return
          }
          if (event.type === 'cropped') {
            setExtracted(event.dataUrl)
            // Tag the data URL so the API knows it's pre-cropped and can skip the crop step on redo
            originalImage.current = event.dataUrl.replace(';base64,', ';cropped;base64,')
          }
          if (event.type === 'completed') {
            setExtracted('')
            createClient().storage.from('assets').remove([uploaded])
            setUploaded(event.storagePath)
            setGenerated(true)
            if (event.title && !title) setTitle(event.title)
            if (event.slug && !name) setName(event.slug)
            if (event.description && !description) setDescription(event.description)
            queryClient.invalidateQueries({ queryKey: ['profile'] })
          }
        }
      }
    } finally {
      setExtracting(false)
    }
  }

  const handleSave = () => {
    if (isEditing) {
      const pathToSave = uploaded
        || (cleared ? null : asset.path)
        || null
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
            if (asset.path) {
              if (pathToSave !== asset.path) {
                createClient().storage.from('assets').remove([asset.path])
              }
            }
            savedRef.current = true
            onClose()
          }
        }
      )
    } else {
      createAsset.mutate(
        { name, title, description, content, type, path: uploaded },
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
    if (uploaded) {
      await createClient().storage.from('assets').remove([uploaded])
    }
    if (!isEditing) resetForm()
    onClose()
  }

  const resetForm = () => {
    setUploaded('')
    originalImage.current = ''
    setName('')
    setTitle('')
    setDescription('')
    setContent('')
    setGenerated(false)
    setExtracted('')
    setCleared(false)
  }

  const canSuggest = (!!uploaded || !!content) && !suggesting && !previewing && !extracting
  const isPending = createAsset.isPending || updateAsset.isPending
  const canSave = !!name && !isPending

  const preview = extracted
    || (uploaded ? assetUrl(uploaded) : undefined)
    || (!cleared && asset?.path ? assetUrl(asset.path) : undefined)

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
              { content.length > 0 && (
                <CreditButton
                  cost={1}
                  type="button"
                  size="xs"
                  onClick={handlePreview}
                  disabled={previewing}
                  className="absolute bottom-1 right-1 gap-2 self-start">
                  {previewing ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )}
                  Generate preview image
                </CreditButton>)}
              {previewing && <div className="pulse absolute inset-0 rounded-2xl pointer-events-none" />}
              <div className={cn('error absolute left-0 w-full h-1/2 rounded-xl p-4 transition-top duration-300 backdrop-blur-md',
                  previewError ? 'top-1/2' : 'top-full'
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
          value={preview}
          compress={type !== 'face'}
          onBeforeUpload={setOriginalImage}
          placeholder={(
            runMode === 'text'
              ? `Upload preview image (optional)`
              : uploadPlaceholders[type]
          )}
          onComplete={(path) => {
            if (uploaded && uploaded !== path) {
              createClient().storage.from('assets').remove([uploaded])
            }
            setUploaded(path)
            setGenerated(false)
            setExtracted('')
            setCleared(false)
          }}
          onClear={() => {
            if (uploaded) {
              createClient().storage.from('assets').remove([uploaded])
            }
            originalImage.current = ''
            setUploaded('')
            setExtracted('')
            setGenerated(false)
            setCleared(true)
          }}>
          <Badge variant="ghost"
            className="absolute top-2 left-2 text-xs font-medium bg-neutral text-neutral-foreground z-1">
            { runMode === 'text'
              ? 'Preview (optional)'
              : 'Reference image' }
          </Badge>
          <div className="absolute bottom-1 right-1 flex items-center gap-1">
            {uploaded && (
              <CreditButton
                cost={1}
                type="button"
                size="xs"
                onClick={handleExtract}
                disabled={extracting}
                className="z-1 gap-2">
                {extracting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                {generated ? `Re-extract ${type}` : `Extract ${type}`}
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
          <div className={cn('absolute h-full w-full inset-0 pointer-events-none left-0 transition-top duration-300',
            extracting
              ? 'top-0'
              : 'top-full'
          )}>
            <div className="pulse h-full w-full rounded-xl"></div>
          </div>
          <div className={cn('error absolute left-0 bottom-0 w-full h-1/2 rounded-xl p-4 transition-top duration-300 backdrop-blur-md',
              extractError ? 'top-1/2' : 'top-full'
            )}>
            <CloseButton size="icon-lg" onClick={() => setExtractError('')} />
            {extractError}
          </div>
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
