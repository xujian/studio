# AssetsManager Design

## Goal

Sidebar tool buttons open a per-type asset management dialog where users can view, select, upload, and delete their assets (self-uploaded or purchased).

## Architecture

### Communication

- `Sidebar` tracks `activeTool` (already done) and owns `open` state for the dialog
- On button click: sets `activeTool` + opens `<AssetsManager type={activeTool} />`
- On "Use": fires `mixin:select { type, assetId }` via `$bus`
- `Producer` listens for `mixin:select` and calls `setMixins({ ...mixins, [type]: assetId })`

### Components

```
<Sidebar>
  → on button click: opens <AssetsManager> with type prop

<AssetsManager type="face" | "hair" | "outfit" | "scene" | "camera" | "mood">
  → Shadcn Dialog
  → Header: type label + upload button
  → Grid: asset cards (filtered by type)
    → Each card: thumbnail + name
    → Hover: "Use" button (all assets) + delete button (owned only)
  → On "Use": fires bus event mixin:select { type, assetId }, closes dialog

<Producer>
  → listens for mixin:select
  → calls setMixins({ ...mixins, [type]: assetId })
```

### New Hooks

**`useUploadAsset()`**
1. Upload image file to Supabase Storage: `assets/{userId}/{filename}`
2. Insert row into `assets` table: `{ user_id, name, type, url, is_public: false }`
3. Invalidates `['assets']` query cache on success

**`useDeleteAsset()`**
1. Delete file from Supabase Storage
2. Delete row from `assets` table
3. Invalidates `['assets']` query cache on success

### Existing (unchanged)

- `useAssets()` — already fetches owned + purchased assets via `get_user_assets` RPC
- `AssetCard` component — reused in the grid
- `$bus` — existing event bus pattern

## Ownership Guard

Purchased assets show without a delete button.
Guard: `asset.user_id === userId` — only show delete for owned assets.

## Files to Create/Modify

| File | Action |
|------|--------|
| `components/assets-manager.tsx` | Create — the dialog component |
| `hooks/use-upload-asset.ts` | Create — upload mutation |
| `hooks/use-delete-asset.ts` | Create — delete mutation |
| `components/sidebar.tsx` | Modify — add open state + wire AssetsManager |
| `components/producer/index.tsx` | Modify — listen for `mixin:select` bus event |
