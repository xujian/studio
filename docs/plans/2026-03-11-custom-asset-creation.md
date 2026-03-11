# Custom Asset Creation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let users create custom assets of any type via a dialog form with AI-assisted name/title suggestion.

**Architecture:** New `AssetCreateDialog` component replaces the direct file-input trigger in `AssetsManager`. A new `POST /api/assets/suggest` endpoint uses Gemini to generate `name` + `title` from uploaded image and/or text content. Image upload and asset record creation are separated into two hooks: `useUploadImage` (reusable, uploads file immediately) and `useCreateAsset` (inserts asset record). If the user cancels after uploading an image, the uploaded file is deleted.

**Tech Stack:** Next.js App Router, React Hook Form, Zod, Supabase Storage, Gemini (`NANO_BANANA_MODEL`), TanStack Query, Shadcn UI

---

### Task 1: Create `useUploadImage` and `useCreateAsset` hooks

**Files:**
- Create: `hooks/use-upload-image.ts`
- Create: `hooks/use-create-asset.ts`
- Leave `hooks/use-upload-asset.ts` untouched

---

#### `hooks/use-upload-image.ts`

Uploads a file to Supabase Storage bucket `assets`. Returns the storage path. Reusable across the app.

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function randomHex(bytes = 8) {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
}

export const useUploadImage = () => {
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = async (file: File): Promise<string> => {
    if (!file.type.startsWith('image/')) throw new Error('Only image files are supported')
    setUploading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${session.user.id}/${randomHex()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(path, file, { contentType: file.type, upsert: false })
      if (uploadError) throw uploadError
      return path
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setError(msg)
      throw err
    } finally {
      setUploading(false)
    }
  }

  const remove = async (path: string) => {
    await supabase.storage.from('assets').remove([path])
  }

  return { upload, remove, uploading, error }
}
```

---

#### `hooks/use-create-asset.ts`

Inserts an asset record. Does not handle file upload — expects `path` already uploaded.

```typescript
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { AssetType } from '@/lib/types'

interface CreateAssetArgs {
  name: string
  title?: string
  description?: string
  content?: string
  type: AssetType
  path?: string | null
}

export const useCreateAsset = () => {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, title, description, content, type, path }: CreateAssetArgs) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('assets')
        .insert({
          user_id: session.user.id,
          name,
          title: title || undefined,
          description: description || undefined,
          content: content || undefined,
          type,
          path: path || null,
          is_public: false
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    }
  })
}
```

---

**Step: Verify build passes**

```bash
cd /Users/mike/Work/studio/.worktrees/feature/custom-asset-creation
pnpm build 2>&1 | tail -20
```

**Step: Commit**

```bash
git add hooks/use-upload-image.ts hooks/use-create-asset.ts
git commit -m "feat: add useUploadImage and useCreateAsset hooks"
```

---

### Task 2: Create `POST /api/assets/suggest` endpoint

**Files:**
- Create: `app/api/assets/suggest/route.ts`

**Step 1: Create the route file**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  type: z.string(),
  content: z.string().optional(),
  storagePath: z.string().optional(), // path in Supabase Storage 'assets' bucket, already uploaded
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const validation = schema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { type, content, storagePath } = validation.data

  if (!content && !storagePath) {
    return NextResponse.json({ error: 'Provide content or storagePath' }, { status: 400 })
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

  const parts: object[] = []

  // Fetch image from Supabase Storage and pass as inline data
  if (storagePath) {
    const supabase = await createClient()
    const { data } = supabase.storage.from('assets').getPublicUrl(storagePath)
    const imageRes = await fetch(data.publicUrl)
    const buffer = await imageRes.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mimeType = imageRes.headers.get('content-type') || 'image/jpeg'
    parts.push({ inlineData: { data: base64, mimeType } })
  }

  const textPrompt = [
    `You are naming an asset of type "${type}" for an AI portrait photography app.`,
    content ? `Asset description: "${content}"` : '',
    storagePath ? 'An image of the asset is provided above.' : '',
    '',
    'Return ONLY a JSON object with two keys:',
    '- "name": a lowercase slug (e.g. "summer-casual", "soft-pink-makeup") — max 32 chars, no spaces',
    '- "title": a short human-readable label (e.g. "Summer Casual", "Soft Pink Makeup") — max 40 chars',
    '',
    'Example: {"name":"summer-casual","title":"Summer Casual"}',
  ].filter(Boolean).join('\n')

  parts.push({ text: textPrompt })

  try {
    const response = await ai.models.generateContent({
      model: process.env.NANO_BANANA_MODEL!,
      contents: [{ role: 'user', parts }],
    })

    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON in response')
    const result = JSON.parse(match[0])

    return NextResponse.json({
      name: String(result.name || '').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 32),
      title: String(result.title || '').slice(0, 40),
    })
  } catch (err) {
    console.error('[assets/suggest]', err)
    return NextResponse.json({ error: 'Suggestion failed' }, { status: 500 })
  }
}
```

**Step 2: Verify build passes**

```bash
pnpm build 2>&1 | tail -20
```

**Step 3: Commit**

```bash
git add app/api/assets/suggest/route.ts
git commit -m "feat: add POST /api/assets/suggest endpoint"
```

---

### Task 3: Create `AssetCreateDialog` component

**Files:**
- Create: `components/asset-create-dialog.tsx`

Uses `useUploadImage` (immediate upload on file pick) and `useCreateAsset` (on Save).
On cancel, if an image was already uploaded, delete it from storage.

**Step 1: Create the component**

```typescript
'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useUploadImage } from '@/hooks/use-upload-image'
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
  const { upload, remove, uploading } = useUploadImage()
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
    // Show local preview immediately
    setPreview(URL.createObjectURL(file))
    // Upload immediately, store path
    try {
      const path = await upload(file)
      setUploadedPath(path)
    } catch {
      setPreview(null)
    }
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
            Suggest name & title
          </Button>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="asset-name">Name <span className="text-destructive">*</span></Label>
            <Input
              id="asset-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. summer-casual"
            />
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="asset-title">Title</Label>
            <Input
              id="asset-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Summer Casual"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="asset-description">Description</Label>
            <Input
              id="asset-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="A note for yourself"
            />
          </div>

          {/* Content */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="asset-content">Content</Label>
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
```

**Step 2: Verify build passes**

```bash
pnpm build 2>&1 | tail -20
```

**Step 3: Commit**

```bash
git add components/asset-create-dialog.tsx
git commit -m "feat: add AssetCreateDialog component"
```

---

### Task 4: Wire dialog into `AssetsManager`

**Files:**
- Modify: `components/assets-manager.tsx`

**Step 1: Replace file input with dialog state**

Remove:
- `fileInputRef`
- `handleUpload` function
- hidden `<input type="file">` element
- the `onClick={() => fileInputRef.current?.click()}` on the Add button

Add:
- `import { AssetCreateDialog } from '@/components/asset-create-dialog'`
- `const [dialogOpen, setDialogOpen] = useState(false)`
- The Add button now calls `setDialogOpen(true)`
- Render `<AssetCreateDialog type={type} open={dialogOpen} onOpenChange={setDialogOpen} />` at the bottom of the JSX

Remove the `useUploadAsset` import from this file (it moves entirely into `AssetCreateDialog`).

The Add card button (the dashed border tile) becomes:

```tsx
<button
  onClick={() => setDialogOpen(true)}
  className="rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors">
  <Plus className="size-6" />
  <span className="text-xs">Add an {label.toLowerCase()} asset</span>
</button>
```

**Step 2: Verify build passes**

```bash
pnpm build 2>&1 | tail -20
```

**Step 3: Commit**

```bash
git add components/assets-manager.tsx
git commit -m "feat: wire AssetCreateDialog into AssetsManager"
```

---

## Manual Test Checklist

Before finishing, verify the following in the browser:

1. Open `AssetsManager` for any asset type — click the Add tile → dialog opens
2. Upload an image → preview appears in the upload area
3. Click "Suggest name & title" with no image and no content → button is disabled
4. Enter some content → click "Suggest" → `name` and `title` fields populate
5. Upload image + click "Suggest" → fields populate based on image
6. Clear `name` field → Save button is disabled
7. Fill name → click Save → dialog closes, asset appears in grid
8. Create a text-only asset (no image) → saves successfully
9. Verify DELETE still works on newly created assets
