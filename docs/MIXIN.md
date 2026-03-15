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

**Rule:** an ad-hoc asset is a regular `Asset` record with `name = "custom"`. No schema change required.

**Input UI:** a custom button at the end of the asset list in each Mixins popover. When clicked, it opens a panel where the user can type text or upload an image. Once saved, the ad-hoc asset appears as an item in the asset list and can be selected like any other asset — one asset per slot.

**Flow on generate:**
1. User opens a Mixins slot popover, clicks the custom button, enters content or uploads an image
2. Asset is saved with `name = "custom"` and appears in the popover list
3. User selects it — UUID is stored in `mixins` like any other asset
4. The moment (and any retries) reference it normally

**Identifying ad-hoc assets:** `asset.name === "custom"`

**Visibility:**
- Hidden in `AssetsManager` — not listed in the user's library
- Shown in `MomentView` photo attributes with a `"custom"` label

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
