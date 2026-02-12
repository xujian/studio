# Store Page Design

## Overview

Asset store page for browsing and purchasing official Kanojo Studio assets. Designed for official assets now, marketplace (user-selling) later.

## Page Structure

Single scrollable page with grouped sections, one per asset type. Order follows `assetTypes` from constants: Face, Makeup, Hair, Outfit, Scene, Lighting, Camera, Mood.

Each section:
- **Section header** — Type name (e.g., "Outfits") + "See all" / "Show less" toggle on right
- **Grid preview** — 4 asset cards in responsive row (`grid-cols-2 md:grid-cols-3 lg:grid-cols-4`)
- **Expanded state** — Full grid of all assets for that type, inline expand with motion animation
- Empty types are skipped

## Asset Card (`store-card.tsx`)

- **Image area** — Portrait aspect ratio (`aspect-[9/16]`) for image assets, styled text preview for text-based assets
- **Title** — Asset name
- **Type badge** — Badge component showing asset type
- **Price/status**:
  - Owned: Checkmark badge, no price
  - Not owned: Price in credits + "Buy" button
- **Hover** — Peekable preview with full description, larger image, asset details
- **Styling** — Card + glass background, float-panel hover, glow on hover, skeleton loading

## Data Fetching

### `useStore()` hook
- Fetches all public assets via `get_store_assets(user_uuid)` RPC
- Returns assets with `is_purchased` boolean
- Grouped client-side by `asset.type` for section layout
- Separate from `useAssets()` (which returns user's own + purchased)

### `usePurchase()` hook
- Mutation hook for buying assets
- Optimistic update — card shows owned immediately
- Invalidates both `store` and `assets` query caches
- Toast on success/error (insufficient credits)

## Purchase Flow

1. User clicks "Buy" on card
2. Optimistic update — card shows as owned
3. RPC `purchase_asset(asset_uuid)`:
   - Check sufficient credits
   - Insert into `purchases`
   - Deduct credits from profile
   - Single transaction
4. Cache invalidation (`store` + `assets` keys)
5. Toast notification

## New Supabase Functions

### `get_store_assets(user_uuid uuid)`
Returns all public assets with `is_purchased` boolean for the given user.

### `purchase_asset(asset_uuid uuid)`
Atomic purchase: validates credits, inserts purchase, deducts credits.

## Components

| Component | Type | Purpose |
|---|---|---|
| `app/store/page.tsx` | Server | Page shell (exists) |
| `components/store-grid.tsx` | Client | Sections layout, data fetch, expand state |
| `components/store-card.tsx` | Client | Asset card with preview, price, buy |
| `hooks/use-store.ts` | Client | Query hook for public store assets |
| `hooks/use-purchase.ts` | Client | Mutation hook for buying assets |
