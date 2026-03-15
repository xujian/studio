# Assets

Reusable prompt components that shape how portraits are generated. Each asset corresponds to one visual dimension of the output.

## Asset Types

| Type | Description |
|---|---|
| `face` | Reference face image fed directly to Gemini |
| `hair` | Hair style (image or text description) |
| `makeup` | Makeup style (image or text description) |
| `outfit` | Clothing description (image or text) |
| `scene` | Background/environment (image or text) |
| `lighting` | Lighting setup (image or text) |
| `camera` | Camera style / lens choice (image or text) |
| `mood` | Emotional tone / atmosphere (image or text) |

## Data Model (`assets` table)

```ts
type Asset = {
  id?: string
  user_id?: string       // NULL = official Kanojo Studio asset
  name?: string          // slug identifier, e.g. "wavy-dark-brown"
  title?: string         // human label, e.g. "Wavy Dark Brown"
  description?: string   // user note for personal reference
  type: AssetType
  path?: string | null   // relative path in 'assets' storage bucket (image-based), for text-based assets, it's a preview image
  content?: string | null // text fed to the engine (text-based)
  price?: number | null  // credits cost; NULL = personal, not for sale
  created_at?: string
}
```

## Image or Text

`face` is always image-based — a face cannot be described in text.

All other asset types support two modes:

- **Text-based** (`content` set): the text is passed directly to the engine as the prompt for that slot. If `path` is also set, the image serves as a visual preview only — it is not fed to the engine.
- **Image-based** (`content` empty, `path` set): the image is passed to the engine as a visual reference for that slot (e.g. a scene photo used as background context).

`content` takes precedence — when both are present, the engine uses the text and ignores the image as input.

`mood`, `lighting`, and `camera` are almost always text-based, as they describe abstract qualities that are easier to specify in words than to photograph.

## Ownership Model

| `user_id` | `is_purchased` | Description |
|---|---|---|
| NULL | — | Official Kanojo Studio asset (free or purchasable) |
| user's id | false | Personal/custom asset |
| another user's id | true | Purchased from store |

The `get_user_assets` Postgres RPC returns all three categories in one query.

## How Assets Flow into Generation

At generation time, `Mixins` maps asset types to asset IDs:

```ts
type Mixins = { [k in AssetType]?: string } // assetId per slot
```

`AssetsBuilder.build(assets)` converts loaded asset records into:
- **Image parts** — for `face` (and any image-based assets): passed as inline image data to Gemini
- **Text sections** — for text-based assets: override the corresponding JSON key in the prompt

The assembled prompt sent to Gemini is: `[...imageParts, combinedJsonText]`.

## Asset Storage

Images are stored in the Supabase `assets` bucket at:
```
assets/{userId}/{type}/{filename}.{ext}
```

`assetUrl(path)` in `lib/utils.ts` resolves a storage path to a public URL.

## Creating an Asset

### Flow

1. User opens `AssetsManager` for a type → clicks "Add"
2. `AssetCreateDialog` opens (type pre-set)
3. User uploads an image and/or enters text content
4. User clicks **✨ Suggest name & title** → `POST /api/assets/suggest` → Gemini fills `name` + `title`
5. User reviews/edits fields, clicks **Save**
6. `useCreateAsset` inserts into `assets` table, invalidates `['assets']` cache

### API: `POST /api/assets/suggest`

Generates `name` (slug) and `title` (human label) from asset content/image via Gemini (`NANO_BANANA_MODEL`).

**Request:**
```json
{ "type": "hair", "content": "wavy dark brown hair", "storagePath": "assets/userId/hair/file.jpg" }
```
At least one of `content` or `storagePath` is required.

**Response:**
```json
{ "name": "wavy-dark-brown", "title": "Wavy Dark Brown" }
```

### Hook: `useCreateAsset`

```ts
createAsset.mutate({ name, title, description, content, type, path })
// → inserts into assets table, invalidates ['assets'] cache
```

### Hook: `useDeleteAsset`

Deletes the storage file and database row. `useRemovePurchase` handles purchased assets (removes the purchase record instead).

## Fetching Assets

`useAssets()` calls the `get_user_assets(user_uuid)` Postgres RPC which returns owned + purchased assets in one query, returning `AssetWithPurchaseInfo[]` (adds `is_purchased: boolean`).

Cache: 5 minutes (`staleTime`).

## Asset Manager UI

`AssetsManager` — per-type panel (opened from the sidebar tool buttons):
- Lists assets filtered by type
- "Add" button → opens `AssetCreateDialog`
- Each card: thumbnail (image) or text preview, hover actions: **USE** / **DELETE** / **BUY**

`AssetCard` actions:
- **USE** — emits `mixin:select { type, assetId }` on `$bus` → `Producer` picks it up and sets the mixin
- **DELETE** — removes the asset (owned) or removes the purchase (purchased)
- **BUY** — opens `PurchaseModal` for store assets

## Key Files

| File | Role |
|---|---|
| `lib/types.ts` | `Asset`, `AssetType`, `Mixins`, `AssetWithPurchaseInfo` types |
| `lib/constants.ts` | `assetTypes` array, `defaultAssets` |
| `components/assets-manager.tsx` | Per-type asset manager panel |
| `components/asset-create-dialog.tsx` | Create asset dialog (upload + text + suggest) |
| `components/asset-card.tsx` | Asset grid card with USE/DELETE/BUY actions |
| `hooks/use-assets.ts` | Fetch owned + purchased assets via RPC |
| `hooks/use-create-asset.ts` | Insert new asset mutation |
| `hooks/use-delete-asset.ts` | Delete asset / remove purchase mutations |
| `app/api/assets/suggest/route.ts` | Gemini-powered name+title suggestion |
| `supabase/schema.sql` | `assets` table, `get_user_assets` RPC |
