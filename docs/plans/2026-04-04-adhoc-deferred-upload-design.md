# Ad-hoc Mixins — Deferred Upload Design

**Date:** 2026-04-04
**Status:** Ready for implementation
**Supersedes:** Parts of `2026-04-03-ad-hoc-mixins-design.md` (the "save to DB immediately" approach)

## Problem

The current ad-hoc mixin implementation creates a DB record + storage upload the moment the user clicks "Save" in the popover. If the user never generates (navigates away, closes the tab), the asset is orphaned in DB and storage with no cleanup path.

## Solution

Defer all persistence to generate time. Ad-hoc content lives entirely in React state until the user clicks Generate. Only at that point does `handleGenerate()` in `<Producer>` create the asset records and resolve IDs before calling `useEngine`.

**Result:** no orphan problem — an ad-hoc asset only exists in the DB once it's actually used in a generation.

## New `<Dropzone>` Component

Extract a new `components/dropzone.tsx`:

- Pure UI — no Supabase, no upload
- Accepts file via click, drop, or paste
- Compresses image client-side (reuses `compressImage` from `lib/compress-image`)
- Calls `onFile(dataUrl: string)` with base64 result
- Shows local preview from the data URL
- Has `onClear` callback
- `value?: string` prop for controlled preview display

`<Upload>` is **unchanged**. The ad-hoc image tab in `<Mixins>` swaps `<Upload>` for `<Dropzone>`.

## `LocalMixins` Type

Add to `lib/types.ts`:

```ts
export type AdHocContent = { content: string } | { dataUrl: string }
export type LocalMixins = { [k in AssetType]?: string | AdHocContent }
```

`Mixins` (DB type, string IDs only) is **unchanged**. `LocalMixins` is the UI-layer type.

## `<Mixins>` Component Changes

- Props change: `value: LocalMixins`, `onChange: (v: LocalMixins) => void`
- Ad-hoc "Save" → renamed "Done", calls `onChange({ ...value, [type]: { content } | { dataUrl } })`
- No `useCreateAsset`, no `useDeleteAsset`, no `savedAdhoc` state
- Preview in popover: if `value[type]` is an `AdHocContent` object → show inline preview (image from dataUrl, or text snippet); X button sets `onChange({ ...value, [type]: undefined })`
- No storage cleanup on clear — nothing was uploaded yet

## `<Producer>` Changes

State type changes from `Mixins` to `LocalMixins`:
```ts
const [mixins, setMixins] = useState<LocalMixins>({})
```

`handleGenerate` becomes async and resolves inline entries before calling `useEngine`:

```ts
const handleGenerate = async () => {
  if (couldNotSubmit) return

  // Resolve any inline ad-hoc entries to real asset IDs
  const resolvedMixins: Mixins = {}
  for (const [type, entry] of Object.entries(mixins)) {
    if (typeof entry === 'string') {
      resolvedMixins[type as AssetType] = entry
    } else if ('content' in entry) {
      const asset = await createAssetAsync({ name: '', type: type as AssetType, content: entry.content })
      resolvedMixins[type as AssetType] = asset.id!
    } else if ('dataUrl' in entry) {
      const blob = await fetch(entry.dataUrl).then(r => r.blob())
      const file = new File([blob], 'adhoc.jpg', { type: blob.type })
      const { storagePath } = await uploadAsync(file)
      const asset = await createAssetAsync({ name: '', type: type as AssetType, path: storagePath })
      resolvedMixins[type as AssetType] = asset.id!
    }
  }

  commit({ prompt: ..., mixins: resolvedMixins, reference, momentId }, { onSuccess: ... })
}
```

Uses promise-based versions of `useCreateAsset` and `useUpload` mutations (TanStack Query `mutateAsync`).

`$bus.on('moment:resume')` sets `mixins` from a resumed moment — those are always `Mixins` (string IDs from DB), compatible with `LocalMixins`.

`$bus.on('mixin:select')` from `AssetCard` sets a string ID — also compatible with `LocalMixins`.

## What Does Not Change

- `useEngine` hook — unchanged
- API route — unchanged
- Zod `engineRequestSchema` — unchanged
- Engine — unchanged
- `useCreateAsset` — unchanged (used by `handleGenerate`)
- `useUpload` — unchanged (used by `handleGenerate`)
- `AssetsManager` filter — unchanged (`name !== ''` still hides ad-hoc assets)
- `<Upload>` component — unchanged

## Files to Change

| File | Change |
|------|--------|
| `components/dropzone.tsx` | **Create** — extracted from Upload logic |
| `lib/types.ts` | Add `AdHocContent`, `LocalMixins` types |
| `components/mixins.tsx` | Use `LocalMixins`, `<Dropzone>`, remove DB calls |
| `components/producer.tsx` | Use `LocalMixins`, async `handleGenerate` resolution |
