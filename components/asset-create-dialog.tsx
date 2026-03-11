'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useUpload } from '@/hooks/use-upload'
import { useCreateAsset } from '@/hooks/use-create-asset'
import type { AssetType } from '@/lib/types'
import { Loader2, Sparkles, Upload } from 'lucide-react'

interface AssetCreateDialogProps {
  type: AssetType
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssetCreateDialog({ type, open, onOpenChange }: AssetCreateDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { upload, remove, uploading } = useUpload({ bucket: 'assets' })
  const createAsset = useCreateAsset()

  const [preview, setPreview] = useState<string | null>(null)
  const [uploadedPath, setUploadedPath] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [suggesting, setSuggesting] = useState(false)

  const label = type.charAt(0).toUpperCase() + type.slice(1)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    upload(file, {
      onSuccess: ({ path }) => setUploadedPath(path),
      onError: () => setPreview(null),
    })
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
          storagePath: uploadedPath || undefined,
        }),
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
          onOpenChange(false)
          resetForm()
        }
      }
    )
  }

  const handleCancel = async () => {
    if (uploadedPath) await remove(uploadedPath)
    resetForm()
    onOpenChange(false)
  }

  const resetForm = () => {
    setPreview(null)
    setUploadedPath(null)
    setName('')
    setTitle('')
    setDescription('')
    setContent('')
  }

  const canSuggest = (!!uploadedPath || !!content) && !suggesting && !uploading
  const canSave = !!name && !createAsset.isPending && !uploading

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleCancel(); else onOpenChange(v) }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create {label} Asset</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Image upload */}
          <div
            className="relative aspect-video w-full cursor-pointer rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden hover:border-foreground/30 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {preview
              ? <Image src={preview} alt="preview" fill className="object-cover" />
              : <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="size-6" />
                  <span className="text-xs">Upload image (optional)</span>
                </div>
            }
            {uploading && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                <Loader2 className="size-6 animate-spin" />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Suggest button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canSuggest}
            onClick={handleSuggest}
            className="self-start gap-2"
          >
            {suggesting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Suggest name &amp; title
          </Button>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="asset-name" className="text-sm font-medium">Name <span className="text-destructive">*</span></label>
            <Input
              id="asset-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. summer-casual"
            />
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="asset-title" className="text-sm font-medium">Title</label>
            <Input
              id="asset-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Summer Casual"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="asset-description" className="text-sm font-medium">Description</label>
            <Input
              id="asset-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="A note for yourself"
            />
          </div>

          {/* Content */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="asset-content" className="text-sm font-medium">Content</label>
            <Textarea
              id="asset-content"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Text fed to the engine (e.g. light linen pants, white crop top)"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {createAsset.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
