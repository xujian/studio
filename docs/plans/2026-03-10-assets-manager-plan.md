# AssetsManager Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Sidebar tool buttons open a per-type asset management dialog where users can view, select, upload, and delete their assets.

**Architecture:** Sidebar opens `<AssetsManager type={activeTool}>` (Shadcn Dialog). "Use" fires `mixin:select` bus event consumed by Producer. Two new hooks handle upload/delete mutations.

**Tech Stack:** Next.js App Router, TanStack Query, Supabase client, Shadcn Dialog, mitt bus

---

### Task 1: Add `mixin:select` to the event bus

**Files:**
- Modify: `lib/bus.ts`

**Step 1: Add `MixinSelectPayload` type and event**

In `lib/bus.ts`, add to the `Events` type map and export the payload type:

```typescript
export type MixinSelectPayload = {
  type: AssetType
  assetId: string
}

type Events = {
  'generation:complete': MomentWithPhotos
  'generation:error': Error
  'moment:resume': MomentResumePayload
  'mixin:select': MixinSelectPayload
}
```

Also add `AssetType` to the imports at top:
```typescript
import type { Mixins, MomentWithPhotos, AssetType } from './types'
```

**Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```
Expected: no errors

**Step 3: Commit**

```bash
git add lib/bus.ts
git commit -m "feat: add mixin:select event to bus"
```

---

### Task 2: Create `useUploadAsset` hook

**Files:**
- Create: `hooks/use-upload-asset.ts`

**Step 1: Create the hook**

```typescript
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { AssetType } from '@/lib/types'

function randomHex(bytes = 8) {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
}

interface UploadAssetArgs {
  file: File
  name: string
  type: AssetType
}

export const useUploadAsset = () => {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, name, type }: UploadAssetArgs) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const ext = file.name.split('.').pop() || 'jpg'
      const filename = `${session.user.id}/${randomHex()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filename, file, { contentType: file.type, upsert: false })

      if (uploadError) throw uploadError

      const { error: insertError } = await supabase
        .from('assets')
        .insert({ user_id: session.user.id, name, type, path: filename, is_public: false })

      if (insertError) throw insertError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    }
  })
}
```

**Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

**Step 3: Commit**

```bash
git add hooks/use-upload-asset.ts
git commit -m "feat: add useUploadAsset hook"
```

---

### Task 3: Create `useDeleteAsset` hook

**Files:**
- Create: `hooks/use-delete-asset.ts`

**Step 1: Create the hook**

```typescript
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export const useDeleteAsset = () => {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (assetId: string) => {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', assetId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    }
  })
}
```

**Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

**Step 3: Commit**

```bash
git add hooks/use-delete-asset.ts
git commit -m "feat: add useDeleteAsset hook"
```

---

### Task 4: Create `<AssetsManager>` component

**Files:**
- Create: `components/assets-manager.tsx`

**Step 1: Create the component**

```typescript
'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/button'
import { useAssets } from '@/hooks/use-assets'
import { useUploadAsset } from '@/hooks/use-upload-asset'
import { useDeleteAsset } from '@/hooks/use-delete-asset'
import { useBus } from '@/lib/bus'
import { createClient } from '@/lib/supabase/client'
import { assetUrl } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Asset, AssetType } from '@/lib/types'
import { Loader2, Plus, Trash2, Check } from 'lucide-react'
import { useEffect, useState as useStateAlias } from 'react'

interface AssetsManagerProps {
  type: AssetType
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssetsManager({ type, open, onOpenChange }: AssetsManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [userId, setUserId] = useState('')
  const $bus = useBus()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setUserId(data.session.user.id)
    })
  }, [])

  const { data: assets = [] } = useAssets()
  const uploadAsset = useUploadAsset()
  const deleteAsset = useDeleteAsset()

  const filtered = assets.filter(a => a.type === type)

  const handleUse = (asset: Asset) => {
    if (!asset.id) return
    $bus.emit('mixin:select', { type, assetId: asset.id })
    onOpenChange(false)
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const name = file.name.replace(/\.[^.]+$/, '')
    uploadAsset.mutate({ file, name, type }, {
      onSettled: () => {
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    })
  }

  const label = type.charAt(0).toUpperCase() + type.slice(1)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{label}</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadAsset.isPending}
              className="gap-1.5">
              {uploadAsset.isPending
                ? <Loader2 className="size-4 animate-spin" />
                : <Plus className="size-4" />}
              Upload
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
          </div>
        </DialogHeader>

        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No {label.toLowerCase()} assets yet. Upload one to get started.
          </p>
        )}

        <div className="grid grid-cols-3 gap-3">
          {filtered.map(asset => {
            const isOwned = asset.user_id === userId
            return (
              <div key={asset.id} className="group relative overflow-hidden rounded-xl border bg-muted">
                <div className="aspect-square w-full overflow-hidden">
                  {asset.path ? (
                    <Image
                      src={assetUrl(asset.path)}
                      alt={asset.name || ''}
                      fill
                      className="object-cover"
                      sizes="33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-2">
                      <p className="line-clamp-4 text-xs text-muted-foreground">{asset.content}</p>
                    </div>
                  )}
                </div>

                <p className="truncate px-2 py-1.5 text-xs">{asset.name}</p>

                {/* Hover overlay */}
                <div className={cn(
                  'absolute inset-0 flex flex-col items-center justify-center gap-1.5',
                  'bg-black/60 opacity-0 transition-opacity group-hover:opacity-100'
                )}>
                  <Button
                    size="sm"
                    className="h-7 gap-1 rounded-full px-3 text-xs"
                    onClick={() => handleUse(asset)}>
                    <Check className="size-3" />
                    Use
                  </Button>
                  {isOwned && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 gap-1 rounded-full px-3 text-xs"
                      onClick={() => asset.id && deleteAsset.mutate(asset.id)}
                      disabled={deleteAsset.isPending}>
                      <Trash2 className="size-3" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

**Step 3: Commit**

```bash
git add components/assets-manager.tsx
git commit -m "feat: add AssetsManager dialog component"
```

---

### Task 5: Wire up `<Sidebar>` to open `<AssetsManager>`

**Files:**
- Modify: `components/sidebar.tsx`

**Step 1: Add open state and AssetsManager**

Replace the entire file content with:

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/button'
import { AssetsManager } from '@/components/assets-manager'
import { cn } from '@/lib/utils'
import type { AssetType } from '@/lib/types'

const tools = [
  { id: 'face' as AssetType, label: 'Face', icon: '/icons/face.png' },
  { id: 'hair' as AssetType, label: 'Hair', icon: '/icons/hair.png' },
  { id: 'outfit' as AssetType, label: 'Outfit', icon: '/icons/outfit.png' },
  { id: 'scene' as AssetType, label: 'Scene', icon: '/icons/scene.png' },
  { id: 'camera' as AssetType, label: 'Camera', icon: '/icons/camera.png' },
  { id: 'mood' as AssetType, label: 'Mood', icon: '/icons/mood.png' },
]

export default function Sidebar() {
  const [activeTool, setActiveTool] = useState<AssetType | null>(null)
  const [open, setOpen] = useState(false)

  const handleToolClick = (toolId: AssetType) => {
    setActiveTool(toolId)
    setOpen(true)
  }

  return (
    <>
      <div className="fixed top-1/2 left-8 z-40 -translate-y-1/2">
        <div className="glass relative flex flex-col gap-1 rounded-full p-1">
          {tools.map(tool => (
            <Button
              key={tool.id}
              variant="ghost"
              size="icon-lg"
              onClick={() => handleToolClick(tool.id)}
              tooltip={tool.label}
              className={cn(
                'cursor-pointer rounded-full transition-all duration-300',
                activeTool === tool.id && open
                  ? 'bg-white text-black shadow-[0_4px_16px_rgba(255,255,255,0.15)]'
                  : 'text-white/50 hover:bg-white/10 hover:text-white'
              )}>
              <div
                className="aspect-square size-6 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${tool.icon})` }}
              />
            </Button>
          ))}
        </div>
      </div>

      {activeTool && (
        <AssetsManager
          type={activeTool}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  )
}
```

**Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

**Step 3: Commit**

```bash
git add components/sidebar.tsx
git commit -m "feat: wire Sidebar buttons to open AssetsManager"
```

---

### Task 6: Update `<Producer>` to listen for `mixin:select`

**Files:**
- Modify: `components/producer/index.tsx`

**Step 1: Import `MixinSelectPayload` and add bus listener**

Add to existing imports at top of file:
```typescript
import type { MixinSelectPayload } from '@/lib/bus'
```

In the component body, after the existing `$bus.on('moment:resume', ...)` call, add:
```typescript
$bus.on('mixin:select', (payload: MixinSelectPayload) => {
  setMixins(prev => ({ ...prev, [payload.type]: payload.assetId }))
})
```

**Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

**Step 3: Commit**

```bash
git add components/producer/index.tsx
git commit -m "feat: Producer listens for mixin:select bus event"
```

---

### Task 7: Smoke test

**Step 1: Run dev server**

```bash
pnpm dev
```

**Step 2: Manual verification checklist**

- [ ] Click a sidebar button → AssetsManager dialog opens for that type
- [ ] Dialog shows user's assets for that type (or empty state)
- [ ] Upload button → file picker opens → after upload, asset appears in grid
- [ ] Hover over asset → "Use" and (if owned) "Delete" buttons appear
- [ ] Click "Use" → dialog closes, mixin applied in Producer (visible in Mixins panel)
- [ ] Click "Delete" → asset removed from grid
- [ ] Purchased assets show "Use" but no "Delete"
- [ ] Active tool button highlighted while dialog is open
