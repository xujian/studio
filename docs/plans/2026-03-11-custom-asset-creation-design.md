# Custom Asset Creation — Design

## Overview

A dialog-based creation flow for all 8 asset types. Unified form, same structure for every type. AI-assisted name/title suggestion via a single button.

## Asset Types

| Type | Image role | Text content |
|---|---|---|
| `face` | Reference → fed to Gemini | — |
| `outfit`, `scene`, `makeup`, `hair` | Reference → fed to Gemini | description |
| `lighting`, `camera`, `mood` | Display only (user preview) | description |

The engine handles which asset types use the image as input — the UI does not distinguish this.

## Dialog: `AssetCreateDialog`

Triggered by the existing "Add" button in `AssetsManager`. Pre-configured with the asset `type` so users don't choose it.

### Form Fields (in order)

1. **Image upload** — large upload area with preview. Optional for all types.
2. **Name** — required. Internal identifier (e.g. `"summer-casual"`).
3. **Title** — optional. Display label shown on asset cards (e.g. `"Summer Casual"`).
4. **Description** — optional. User-facing note for their own reference.
5. **Content** — optional. Text fed to the engine (e.g. `"light linen pants, white crop top, sandals"`).

Above the `name` and `title` fields: a single **✨ Suggest** button that fills both fields at once.

### Footer

- **Cancel** — closes dialog, discards changes
- **Save** — disabled while `name` is empty or request is in flight

## AI Suggestion

**Endpoint:** `POST /api/assets/suggest`

**Request:**
```json
{ "type": "outfit", "content": "...", "imageBase64": "..." }
```
Both `content` and `imageBase64` are optional — at least one should be present for good results.

**Response:**
```json
{ "name": "summer-casual", "title": "Summer Casual" }
```

Uses Gemini to analyze the image and/or content and return slug-style `name` + human-readable `title` appropriate for the asset type.

## Save Flow

1. User opens dialog (type pre-set)
2. User uploads image (optional) → preview shown immediately
3. User clicks **✨ Suggest** → calls `/api/assets/suggest` → fills `name` + `title`
4. User reviews/edits all fields
5. User clicks **Save**:
   - If image present: upload to Supabase Storage (`assets/{userId}/{randomHex}.{ext}`)
   - Insert record into `assets` table with all fields
   - Invalidate `['assets']` query cache
   - Close dialog

## Files to Create / Modify

| File | Change |
|---|---|
| `components/asset-create-dialog.tsx` | New dialog component |
| `app/api/assets/suggest/route.ts` | New AI suggestion endpoint |
| `hooks/use-upload-asset.ts` | Extend to accept `title`, `description`, `content` |
| `components/assets-manager.tsx` | Replace file input trigger with dialog |
