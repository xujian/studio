'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Upload, type UploadHandle } from '@/components/upload'
import type { AssetType } from '@/lib/types'
import { useCreateAsset } from '@/hooks/use-create-asset'
import { Loader2, Sparkles } from 'lucide-react'

type AssetCreateProps = {
  type: AssetType
  onClose: () => void
}

export function AssetCreate({ type, onClose }: AssetCreateProps) {
  const uploadRef = useRef<UploadHandle>(null)
  const createAsset = useCreateAsset()

  const [uploadedPath, setUploadedPath] = useState<string>('')
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [suggesting, setSuggesting] = useState(false)

  const label = type.charAt(0).toUpperCase() + type.slice(1)

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
    createAsset.mutate(
      { name, title, description, content, type, path: uploadedPath },
      {
        onSuccess: () => {
          resetForm()
          onClose()
        }
      }
    )
  }

  const handleCancel = async () => {
    await uploadRef.current?.clear()
    resetForm()
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
  const canSave = !!name && !createAsset.isPending

  return (
    <div className="asset-create flex min-h-full flex-col gap-2 p-2">
      {/* Asset content */}
      <Upload
        ref={uploadRef}
        className="aspect-square"
        path={({ userId }) => `assets/${userId}/${type}`}
        onComplete={setUploadedPath} />
      {type !== 'face' && (
        <Textarea label="Content"
          onChange={e => setContent(e.target.value)}
          placeholder={`Describe the ${label.toLowerCase()} (e.g. light linen pants, white crop top)`}
          rows={3} />)
      }
      {type !== 'face' && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="xs"
            disabled={!canSuggest}
            onClick={handleSuggest}
            className="gap-2 self-start">
            {suggesting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            Suggest name &amp; title
          </Button>
        </div>)
      }
      <Input
        id="asset-name"
        label="Name"
        required
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="e.g. summer-casual"
      />
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
          {createAsset.isPending && (
            <Loader2 className="mr-2 size-4 animate-spin" />
          )}
          Save
        </Button>
      </div>
    </div>
  )
}
