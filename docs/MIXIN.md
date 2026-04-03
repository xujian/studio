# Mixins

`Mixins` is a map of asset type → asset ID, representing the active asset selection for a generation:

```typescript
type Mixins = { [k in AssetType]?: string } // e.g. { face: "uuid", outfit: "uuid" }
```

## Storage

Both `moments` and `photos` store mixins as JSONB. Photos only store keys that differ from the moment's baseline (delta pattern). To reconstruct the full mixin set for a photo: `{ ...moment.mixins, ...photo.mixins }`.

## Resolution at Generation Time

The API route resolves asset IDs in mixins to full `Asset` records before calling `engine.generate()`. The engine receives `Assets` (typed `{ [k in AssetType]?: Asset }`), not raw IDs.

## Ad-hoc Mixins

A mixin can be **ad-hoc** — inline content entered directly by the user without selecting a saved asset.

**Rule:** an ad-hoc asset is a regular `Asset` record with `name = ""`. No schema change required.

**Input UI:** a "Quick text/image" button at the bottom of each mixin type popover. Clicking it swaps the asset list for an inline form with Text / Image tabs. On save, the asset is created, auto-selected, and the popover closes. If a saved ad-hoc asset exists for that slot, the button is replaced by a preview (thumbnail or text snippet); clicking the preview re-opens the form to replace it. An X button on the preview deletes the asset.

**Flow on generate:**
1. User opens a Mixins slot popover, clicks "Quick text/image", enters text or uploads an image
2. Asset is created with `name = ""`, auto-selected — UUID stored in `mixins` like any other asset
3. The moment (and any retries) reference it normally

**Identifying ad-hoc assets:** `asset.name === ""`

**Visibility:**
- Hidden in `AssetsManager` and in the mixin popover asset list
- Preview shown in the popover in place of the trigger button (image thumbnail or text snippet)
- Shown in `MomentView` photo attributes with an `"ad-hoc"` label (display label, not the name value)
- Deleted from DB + storage when the user clicks X on the preview

## UI Flow

`AssetCard` emits `mixin:select { type, assetId }` on `$bus` → `Producer` listens and calls `setMixins({ ...mixins, [type]: assetId })`.

## `useMixins(mixins)`

Resolves a `Mixins` map to an `AssetMap` (`Map<id, Asset>`) by fetching all referenced asset IDs in a single query. Cached 5 minutes.

## Related Types

| Type | Description |
|---|---|
| `Mixins` | `{ [k in AssetType]?: string }` — asset type → asset ID |
| `Assets` | `{ [k in AssetType]?: Asset }` — asset type → full Asset record (resolved) |
| `AssetMap` | `Map<string, Asset>` — keyed by asset ID |
