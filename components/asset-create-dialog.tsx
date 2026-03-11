'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Upload, type UploadHandle } from '@/components/upload'
import type { AssetType } from '@/lib/types'
import { useCreateAsset } from '@/hooks/use-create-asset'
import { Loader2, Sparkles } from 'lucide-react'

interface AssetCreateDialogProps {
  type: AssetType
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssetCreateDialog({
  type,
  open,
  onOpenChange
}: AssetCreateDialogProps) {
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
          onOpenChange(false)
          resetForm()
        }
      }
    )
  }

  const handleCancel = async () => {
    await uploadRef.current?.clear()
    resetForm()
    onOpenChange(false)
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
    <Dialog
      open={open}
      onOpenChange={v => {
        if (!v) handleCancel()
        else onOpenChange(v)
      }}>
      <DialogContent className="glass rounded-4xl p-4 w-screen lg:max-w-2xl">
        <DialogHeader className="">
          <DialogTitle className="text-sm my-0">Create {label} Asset</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <Upload ref={uploadRef}
            path={({ userId }) => `assets/${userId}/${type}`}
            onComplete={setUploadedPath} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="asset-content" className="text-sm font-medium">
              Content
            </label>
            <Textarea
              id="asset-content"
              value={content}
              className='min-h-52 resize-none'
              onChange={e => setContent(e.target.value)}
              placeholder="Text fed to the engine (e.g. light linen pants, white crop top)"
              rows={3}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="asset-name" className="text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="asset-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. summer-casual"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="asset-title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="asset-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Summer Casual"
            />
          </div>
          <div className="flex flex-col gap-1 col-span-2">
            <label htmlFor="asset-description" className="text-sm font-medium">
              Description
            </label>
            <Input
              id="asset-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="A note for yourself"
            />
          </div>
        </div>
        <DialogFooter className="flex items-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canSuggest}
            onClick={handleSuggest}
            className="gap-2 self-start">
            {suggesting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Suggest name &amp; title
          </Button>
          <div className="flex-1"></div>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {createAsset.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
