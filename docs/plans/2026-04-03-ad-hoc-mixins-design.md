# Ad-hoc Mixins — Design

**Date:** 2026-04-03
**Status:** Ready for implementation

## Problem

Users can only select pre-saved assets in mixin slots. There's no way to quickly enter one-off text or upload a reference image without going through the full asset creation flow (name, title, description, AI suggestions, etc.).

## Solution

Add an ad-hoc entry path inside each mixin type's popover. The user clicks a button at the bottom of the asset list, sees a minimal inline form (textarea or dropzone), saves, and the ad-hoc asset is auto-selected. No library management required.

## Identity Rule

An ad-hoc asset is a regular `Asset` record with `name = ""`. No schema change required.

- **Identifying ad-hoc assets:** `asset.name === ""`
- **Hidden in** `AssetsManager` — not listed in the user's library
- **Shown in** `MomentView` photo attributes with an `"ad-hoc"` display label

## UI Flow

Each type popover in `Mixins.tsx` has two views, toggled by local state `view: 'list' | 'adhoc'`:

```
list view:
  [asset toggles...]
  [Ad-hoc button]     ← at the bottom of the list

adhoc view:
  [← back]
  [Text | Image] tabs
  textarea            ← Text tab
  dropzone            ← Image tab
  [Save]
```

1. User clicks **Ad-hoc** → `view = 'adhoc'`
2. User enters text or uploads an image
3. User clicks **Save** → `useCreateAsset` called with `name: ''`, `type`, and `content` or `path`
4. On success → new asset auto-selected via `handleSelect`, popover closes, `view` resets to `'list'`
5. User clicks **← back** without saving → `view = 'list'`, uploaded file cleaned up via `removeAssetImage()`

## Components

### `Mixins.tsx`
- Add `view` state per popover (`'list' | 'adhoc'`)
- Add `adHocTab` state (`'text' | 'image'`)
- Add `adHocContent` (string) and `adHocPath` (string) state
- Render ad-hoc form inline inside `PopoverContent` when `view === 'adhoc'`
- On tab switch: clean up uploaded file if switching away from image tab
- On back: clean up uploaded file, reset states
- Reuse `<Upload>` component for the image tab (path: `assets/{userId}/{type}`)
- Reuse `useCreateAsset` mutation

### `AssetsManager`
- Filter out `asset.name === ""` before rendering the grid

### No new files needed.

## What Does Not Change

- `useAssets` hook — returns all assets including ad-hoc (correct, mixin popover needs them)
- `useAssetStatus` — ad-hoc assets are already `isCustom`, so permissions are correct
- Database schema — no changes
- `AssetForm` — untouched

## Rejected Alternatives

- **Separate panel/sheet** — adds navigation complexity for what should be a quick action
- **Auto-submit on blur** — too easy to accidentally trigger; explicit Save is clearer
- **`name = "ad-hoc"` sentinel** — magic string is more fragile than empty string; empty string makes the "no name" intent explicit
