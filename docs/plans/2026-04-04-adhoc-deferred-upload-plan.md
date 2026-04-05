# Ad-hoc Deferred Upload Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the immediate DB-save ad-hoc mixin flow with a deferred approach — ad-hoc content lives in component state until Generate is clicked, eliminating orphaned assets entirely.

**Architecture:** New `<Dropzone>` component outputs base64 data URLs (no upload). `LocalMixins` type extends `Mixins` to support inline content. `<Mixins>` component stores ad-hoc entries as inline objects in state. `Producer.handleGenerate()` resolves inline entries to real asset IDs just before calling the engine.

**Tech Stack:** React state, TanStack Query `mutateAsync`, Supabase Storage, `compressImage` utility, `FileReader` API.

**Design doc:** `docs/plans/2026-04-04-adhoc-deferred-upload-design.md`

---

### Task 1: Add `AdHocContent` and `LocalMixins` types

**Files:**
- Modify: `lib/types.ts`

**Step 1: Add the two new types after the `Mixins` type definition (around line 90)**

The `Mixins` type is at line 90-92:
```ts
export type Mixins = {
  [k in AssetType]?: string
}
```

Add immediately after it:
```ts
/** Inline ad-hoc content held in UI state before being persisted at generate time */
export type AdHocContent = { content: string } | { dataUrl: string }

/** UI-layer mixins type — supports both saved asset IDs and inline ad-hoc content */
export type LocalMixins = {
  [k in AssetType]?: string | AdHocContent
}
```

**Step 2: Verify build**

```bash
cd /Users/mike/Work/studio && pnpm build 2>&1 | grep -E "error TS" | head -20
```

Expected: no TypeScript errors.

**Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add AdHocContent and LocalMixins types

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Create `<Dropzone>` component

A pure UI file-picker that outputs a base64 data URL. No Supabase, no upload.

**Files:**
- Create: `components/dropzone.tsx`

**Step 1: Create the file**

```tsx
'use client'

import Image from 'next/image'
import * as React from 'react'
import { compressImage } from '@/lib/compress-image'
import { Upload as UploadIcon, X } from 'lucide-react'
import { Button } from './button'

export type DropzoneProps = {
  /** Called with base64 data URL after file is picked and compressed */
  onFile: (dataUrl: string) => void
  onClear?: () => void
  /** Controlled preview — pass the data URL to display */
  value?: string
  placeholder?: string
  className?: string
} & Omit<React.ComponentProps<'div'>, 'onDrop'>

export function Dropzone({
  onFile,
  onClear,
  value,
  placeholder = 'Upload image here',
  className,
  ...props
}: DropzoneProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const inputId = React.useId()

  const processFile = async (file: File) => {
    const compressed = await compressImage(file)
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target!.result as string)
      reader.readAsDataURL(compressed)
    })
    onFile(dataUrl)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await processFile(file)
    e.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file?.type.startsWith('image/')) {
      await processFile(file)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClear?.()
  }

  return (
    <div
      className={`relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted transition-colors hover:border-foreground/30 ${isDragging ? 'border-foreground/60 bg-muted/80' : 'border-border'} ${className ?? ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      {...props}>
      <label
        htmlFor={inputId}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
        className="absolute inset-0 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        {value
          ? (<Image src={value} alt="Preview" fill className="object-cover" />)
          : (<div className="flex flex-col items-center gap-2 text-muted-foreground">
              <UploadIcon className="size-6" aria-hidden="true" />
              <p className="text-sm">{placeholder}</p>
            </div>)
        }
      </label>
      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {value && (
        <Button
          type="button"
          size="icon-sm"
          onClick={handleClear}
          className="absolute top-2 right-2 z-10 flex size-6 items-center justify-center rounded-full bg-background/80 text-foreground hover:bg-background"
          aria-label="Remove image">
          <X className="size-3" />
        </Button>
      )}
    </div>
  )
}
```

**Step 2: Verify build**

```bash
cd /Users/mike/Work/studio && pnpm build 2>&1 | grep -E "error TS" | head -20
```

Expected: no errors.

**Step 3: Commit**

```bash
git add components/dropzone.tsx
git commit -m "feat: add <Dropzone> component — base64 output, no upload

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Refactor `<Mixins>` to use `LocalMixins` + `<Dropzone>`

Remove all DB/storage calls. Ad-hoc content is stored inline in the `value` prop.

**Files:**
- Modify: `components/mixins.tsx`

**Step 1: Read the current file first**

Read `components/mixins.tsx` in full before making changes.

**Step 2: Update imports**

Remove these imports:
- `useCreateAsset` from `@/hooks/use-create-asset`
- `useDeleteAsset` from `@/hooks/use-delete-asset`
- `removeAssetImage` from `@/lib/utils` (remove from the `{ assetUrl, cn, removeAssetImage }` destructure — keep `assetUrl` and `cn`)
- `Upload` from `@/components/upload`
- `Asset` from `@/lib/types` (remove from the type import)
- Unused lucide icons: `ArrowUpCircle`, `Check`, `CheckCheck`, `ImageUp`, `UploadIcon`, `PlusCircle`, `X` (keep only what's used after the refactor — `ArrowLeft`, `MoreHorizontalIcon`)

Add:
```ts
import { Dropzone } from '@/components/dropzone'
import type { AdHocContent, LocalMixins } from '@/lib/types'
import { X } from 'lucide-react'
```

**Step 3: Update props type**

Change:
```ts
export type MixinsProps = {
  value?: Mixins
  onChange?: (value: Mixins) => void
}
```

To:
```ts
export type MixinsProps = {
  value?: LocalMixins
  onChange?: (value: LocalMixins) => void
}
```

**Step 4: Replace ad-hoc state — remove old, add new**

Remove these state variables and hooks:
```ts
const [adhocPath, setAdhocPath] = React.useState('')
const [savedAdhoc, setSavedAdhoc] = React.useState<Asset | null>(null)
const createAsset = useCreateAsset()
const deleteAsset = useDeleteAsset()
```

Replace `adhocPath` with:
```ts
const [adhocDataUrl, setAdhocDataUrl] = React.useState('')
```

**Step 5: Update `resetAdhoc`**

Remove the `removeAssetImage` call — nothing to clean up:
```ts
const resetAdhoc = () => {
  setAdhocType(null)
  setAdhocTab('text')
  setAdhocContent('')
  setAdhocDataUrl('')
}
```

**Step 6: Replace `saveAdhoc` with `doneAdhoc`**

Remove the old `saveAdhoc` function entirely. Add:
```ts
const doneAdhoc = (type: AssetType) => {
  const entry: AdHocContent = adhocTab === 'text'
    ? { content: adhocContent }
    : { dataUrl: adhocDataUrl }
  onChange?.({ ...value, [type]: entry })
  setOpenType(null)
  resetAdhoc()
}
```

**Step 7: Remove `deleteAdhoc` function**

Delete the entire `deleteAdhoc` function.

**Step 8: Update the popover `onOpenChange`**

Remove the `resetAdhoc()` call from `onOpenChange` (no storage cleanup needed):
```tsx
onOpenChange={(open) => {
  if (!open) resetAdhoc()
  setOpenType(open ? d.id as AssetType : null)
}}
```

This stays the same — `resetAdhoc` just clears state now, which is still correct.

**Step 9: Update `typeAssets` filter**

The existing filter excludes `name === ''` assets. With deferred approach, no ad-hoc assets are in the DB until generate time, so this filter becomes a no-op — but keep it for safety:
```ts
const typeAssets = (assetsByType[d.id] || []).filter(a => a.name !== '')
```

**Step 10: Update `renderAdhoc` — derive from `value` instead of `savedAdhoc` state**

Replace the `renderAdhoc` function. The ad-hoc entry is now in `value[d.id]`:

```tsx
const adHocEntry = value[d.id as AssetType]
const adHocContent = adHocEntry && typeof adHocEntry === 'object' ? adHocEntry as AdHocContent : null

const renderAdhoc = () => (
  <div className="relative w-30 h-30 hover:border-ring cursor-pointer p-0">
    <Button
      onClick={() => onChange?.({ ...value, [d.id]: undefined })}
      aria-label="Clear ad-hoc"
      className="absolute h-6 w-6 px-0! py-0 right-1 bottom-1 bg-foreground hover:bg-foreground/70 text-background">
      <X />
    </Button>
    {'dataUrl' in adHocContent!
      ? (<Image
          src={adHocContent!.dataUrl}
          width={120}
          height={120}
          className="size-28 object-cover rounded-sm border border-border!"
          alt="ad-hoc" />)
      : <div className="line-clamp-2 px-1 py-1 text-left text-xs rounded-md text-muted-foreground">
          {(adHocContent as { content: string }).content}
        </div>
    }
  </div>
)
```

And update the condition that shows it:
```tsx
{adHocContent
  ? renderAdhoc()
  : renderAdhocTrigger()}
```

**Step 11: Update `adhocForm` — swap `<Upload>` for `<Dropzone>`, update save button**

In `adhocForm`, replace the `<Upload>` in the image tab:
```tsx
<TabsContent value="image">
  <Dropzone
    value={adhocDataUrl || undefined}
    onFile={setAdhocDataUrl}
    onClear={() => setAdhocDataUrl('')}
    className="aspect-video w-full h-50 rounded-md!" />
</TabsContent>
```

Update the Save button's `disabled` condition and `onClick`:
```tsx
<Button
  type="button"
  size="xs"
  className="h-5 flex-1"
  disabled={
    (adhocTab === 'text' && !adhocContent.trim()) ||
    (adhocTab === 'image' && !adhocDataUrl)
  }
  onClick={() => doneAdhoc(d.id as AssetType)}>
  Done
</Button>
```

Note: removed `createAsset.isPending` from disabled — no async call on done.

**Step 12: Remove tab-switch cleanup**

The `onValueChange` on `<Tabs>` previously called `removeAssetImage`. Remove that:
```tsx
onValueChange={(v) => {
  setAdhocTab(v as 'text' | 'image')
}}
```

**Step 13: Verify build**

```bash
cd /Users/mike/Work/studio && pnpm build 2>&1 | grep -E "error TS" | head -20
```

Fix any TypeScript errors before committing.

**Step 14: Commit**

```bash
git add components/mixins.tsx
git commit -m "feat: Mixins uses LocalMixins with deferred ad-hoc storage

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Update `<Producer>` — `LocalMixins` state + async `handleGenerate`

**Files:**
- Modify: `components/producer.tsx`

**Step 1: Read the current file in full before making changes**

Read `components/producer.tsx`.

**Step 2: Update imports**

Add to imports:
```ts
import { useCreateAsset } from '@/hooks/use-create-asset'
import type { LocalMixins, AdHocContent } from '@/lib/types'
```

**Step 3: Update `mixins` state type**

Change line 34:
```ts
[mixins, setMixins] = useState<MixinsType>({}),
```
To:
```ts
[mixins, setMixins] = useState<LocalMixins>({}),
```

**Step 4: Add `useCreateAsset` hook**

After the existing `useEngine` line, add:
```ts
const createAsset = useCreateAsset()
```

**Step 5: Add `uploadFileAsync` helper**

After `const { upload, uploading, remove } = useUpload(...)`, add a promisified wrapper:
```ts
const uploadFileAsync = (file: File): Promise<{ storagePath: string }> =>
  new Promise((resolve, reject) => {
    upload(file, {
      onSuccess: resolve,
      onError: () => reject(new Error('Upload failed')),
    })
  })
```

**Step 6: Make `handleGenerate` async with inline resolution**

Replace the current `handleGenerate` function:
```ts
const handleGenerate = async () => {
  if (couldNotSubmit) return

  // Resolve any inline ad-hoc entries to real asset IDs before generation
  const resolvedMixins: MixinsType = {}
  for (const [type, entry] of Object.entries(mixins) as [AssetType, LocalMixins[AssetType]][]) {
    if (!entry) continue
    if (typeof entry === 'string') {
      resolvedMixins[type] = entry
    } else if ('content' in (entry as AdHocContent)) {
      const asset = await createAsset.mutateAsync({
        name: '',
        type,
        content: (entry as { content: string }).content,
      })
      resolvedMixins[type] = asset.id!
    } else if ('dataUrl' in (entry as AdHocContent)) {
      const dataUrl = (entry as { dataUrl: string }).dataUrl
      const blob = await fetch(dataUrl).then(r => r.blob())
      const ext = blob.type.split('/')[1] || 'jpg'
      const file = new File([blob], `adhoc.${ext}`, { type: blob.type })
      const { storagePath } = await uploadFileAsync(file)
      const asset = await createAsset.mutateAsync({ name: '', type, path: storagePath })
      resolvedMixins[type] = asset.id!
    }
  }

  commit(
    {
      prompt: mode === 'create'
        ? prompt
        : dirty
          ? prompt
          : '',
      mixins: resolvedMixins,
      reference,
      momentId,
    },
    {
      onSuccess: moment => {
        setMomentId(moment.id)
        setMode('retry')
        setDirty(false)
        onGenerationComplete?.(moment)
      }
    }
  )
}
```

**Step 7: Fix `$bus.on('moment:resume')` — resume mixins are always string IDs**

The resumed `payload.mixins` is `Mixins` (string IDs from DB). This is assignable to `LocalMixins`, so no change needed.

**Step 8: Fix `<Mixins>` prop types in JSX**

Line 223 passes `value={mixins}` and `onChange={setMixins}`. Since `mixins` is now `LocalMixins` and `<Mixins>` now accepts `LocalMixins`, this is already correct — no change needed.

**Step 9: Verify build**

```bash
cd /Users/mike/Work/studio && pnpm build 2>&1 | grep -E "error TS" | head -20
```

Fix any TypeScript errors. Common issues:
- `MixinsType` import — `Producer` imports it as `MixinsType` (alias for `Mixins`). Keep using it for `resolvedMixins` type.
- `AdHocContent` narrowing — use `'content' in entry` type guard

**Step 10: Commit**

```bash
git add components/producer.tsx
git commit -m "feat: Producer resolves ad-hoc mixins at generate time

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Update `MIXIN.md` docs

**Files:**
- Modify: `docs/MIXIN.md`

**Step 1: Update the Ad-hoc Mixins section**

The "Flow on generate" section currently says assets are created on Save. Update to reflect deferred persistence:

Replace:
```
**Flow on generate:**
1. User opens a Mixins slot popover, clicks "Quick text/image", enters text or uploads an image
2. Asset is created with `name = ""`, auto-selected — UUID stored in `mixins` like any other asset
3. The moment (and any retries) reference it normally
```

With:
```
**Flow on generate:**
1. User opens a Mixins slot popover, clicks "Quick text/image", enters text or drops an image
2. Clicks "Done" — content stored in UI state as `LocalMixins` only, no DB or storage write yet
3. User clicks Generate — `Producer.handleGenerate()` resolves inline entries to real asset IDs:
   - `{ content }` → inserts an Asset row, gets ID
   - `{ dataUrl }` → uploads image to storage, inserts Asset row, gets ID
4. Resolved `Mixins` (string IDs only) passed to engine and stored in moment/photo
```

Also add a note about `LocalMixins`:
```
**`LocalMixins` type** (UI layer only):
```ts
type AdHocContent = { content: string } | { dataUrl: string }
type LocalMixins = { [k in AssetType]?: string | AdHocContent }
```
`<Mixins>` and `<Producer>` use `LocalMixins` internally. The DB always stores `Mixins` (string IDs).
```

**Step 2: Commit**

```bash
git add docs/MIXIN.md
git commit -m "docs: update MIXIN.md for deferred ad-hoc upload flow

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Manual E2E verification

**Step 1: Start dev server**

```bash
sudo pnpm dev
```

**Step 2: Test text ad-hoc mixin**
1. Open studio → expand mixins → click "outfit" popover
2. Click "Quick text/image" → Text tab shown
3. Type "flowing red silk dress" → click "Done"
4. Popover closes, mixin slot shows `outfit` highlighted
5. Check Supabase `assets` table — **no new row yet** (deferred)
6. Click Generate
7. After generation completes, check `assets` table — new row with `name=""`, `content="flowing red silk dress"`, `type="outfit"`

**Step 3: Test image ad-hoc mixin**
1. Click "scene" popover → Quick text/image → Image tab
2. Drop an image → click "Done"
3. Preview shown in popover (from data URL)
4. Check storage — **no upload yet**
5. Click Generate
6. After generation: check `assets` table for new row + storage file

**Step 4: Test clear**
1. Save an ad-hoc entry (text) → confirm preview shown
2. Click X → entry cleared, "Quick text/image" button returns
3. No DB cleanup needed (nothing was persisted)

**Step 5: Test retry**
1. Generate with ad-hoc mixin
2. Click retry → ad-hoc asset is now a real ID in `moment.mixins` — resolves normally via existing asset path

**Step 6: Verify AssetsManager**
1. Open asset library → confirm no `name=""` assets visible (they appear only after generate)
