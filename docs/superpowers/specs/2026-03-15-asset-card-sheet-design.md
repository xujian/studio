# AssetCard Detail Sheet — Design Spec

**Date:** 2026-03-15
**Status:** Approved

## Problem

`AssetCard` surfaces actions (BUY / USE / DELETE) only via hover buttons, which are hidden by default and provide no way to see full asset details (description, type, price) before acting.

## Solution

Make `AssetCard` clickable. Clicking the card body opens a right-side sheet (`AssetDetailSheet`) that shows full asset details and surfaces the same actions. Hover buttons remain for quick access.

## Scope

- Applies to **both** contexts: Store page and Assets Manager
- Sheet state is **self-contained in `AssetCard`** (follows existing `PurchaseModal` pattern)
- `PurchaseModal` is **unchanged** — BUY inside the sheet closes the sheet first, then opens the modal

## New Files

### `components/ui/sheet.tsx`
Shadcn-style Sheet primitive built on `@radix-ui/react-dialog` (already installed).

**Source:** Run `npx shadcn@latest add sheet` to scaffold, then adjust to match project style (no semicolons, single quotes, arrow functions).

Exports:
- `Sheet` — root (alias for `Dialog`)
- `SheetContent` — slides in from the right with backdrop; accepts `className`
- `SheetHeader`, `SheetFooter` — layout wrappers
- `SheetTitle`, `SheetDescription` — accessible title/description
- `SheetClose` — close trigger

### `components/asset-detail-sheet.tsx`
Sheet content component for an asset.

**Props:**
```ts
type AssetDetailSheetProps = {
  asset: AssetWithPurchaseInfo
  open: boolean
  onOpenChange: (open: boolean) => void
  hasPrice?: boolean
  onBuy: () => void     // caller closes sheet then opens PurchaseModal
  onUse: () => void
  onDelete: () => void  // caller handles mutation + sheet close on success
                        // this component just calls onDelete() — it does NOT self-close
}
```

**Layout (top → bottom):**
1. Full-width image (or text content preview for text-based assets)
2. Type badge + owned/custom/price badge
3. Title, name subtitle, description
4. Action buttons with explicit conditions:
   - **USE** shown when `canUse` (`isPublic || isPurchased || isCustom`)
   - **BUY** shown when `hasPrice && purchasable` (`!isPublic && !isPurchased`)
   - **DELETE** shown when `deletable` (`isPurchased || isCustom`)

**Note on BUY condition:** The existing hover BUY button checks only `hasPrice` (without `purchasable`). This is a known inconsistency (public assets with `hasPrice` show a broken BUY on hover). The sheet uses the stricter `hasPrice && purchasable`. Fixing the hover button is out of scope for this PR — tracked as known debt.

## Modified Files

### `components/asset-card.tsx`
Five changes:

1. **Add `sheetOpen` state** alongside existing `modalOpen`

2. **Make card clickable** — add `onClick={() => setSheetOpen(true)}` to `<Card>`. Clicking anywhere on the card (including the footer/title area) opens the sheet. This is intentional.

3. **Stop propagation on hover buttons** — inline wrappers (handler functions don't take event params):
   ```tsx
   onClick={(e) => { e.stopPropagation(); handleBuy() }}
   onClick={(e) => { e.stopPropagation(); handleUse(data as AssetWithPurchaseInfo) }}
   onClick={(e) => { e.stopPropagation(); handleDelete(data as AssetWithPurchaseInfo) }}
   ```
   Note: The hover DELETE still uses the original `handleDelete` (no `onSuccess` close), which is fine — while the sheet is open, Radix's modal overlay blocks pointer events on the card, so the hover buttons are unreachable with the sheet open.

4. **Render `<AssetDetailSheet>`** at fragment bottom. Always rendered (not gated on `purchasable`).
   - `onBuy`: close sheet then open modal in the same React 18 batched update — avoids two Radix dialogs open simultaneously:
     ```tsx
     onBuy={() => { setSheetOpen(false); setModalOpen(true) }}
     ```
   - `onUse={() => handleUse(data as AssetWithPurchaseInfo)}`
   - `onDelete` — wires `onSuccess: () => setSheetOpen(false)` into the mutation:
     ```tsx
     onDelete={() => {
       if ((data as AssetWithPurchaseInfo).is_purchased) {
         removePurchase.mutate(data.id!, { onSuccess: () => setSheetOpen(false) })
       } else {
         deleteAsset.mutate({ id: data.id!, path: data.path }, { onSuccess: () => setSheetOpen(false) })
       }
     }}
     ```

5. **Remove `purchasable` gate from `PurchaseModal`** — render it unconditionally (safe because `onBuy` in the sheet already guards via `hasPrice && purchasable`, and `setSheetOpen(false)` runs before `setModalOpen(true)`).

**Note on prop type:** `AssetCard` keeps `data: Asset` prop; internal cast to `AssetWithPurchaseInfo` is unchanged. `AssetDetailSheet` receives the already-cast value.

## Dialog Sequencing (BUY flow)

`onBuy` calls `setSheetOpen(false)` and `setModalOpen(true)` in the same synchronous update, batched by React 18. This produces a single render where the sheet exits and the modal enters simultaneously — avoiding two Radix dialogs open at the same time. The sheet exit animation plays while the modal opens, which is visually clean.

## Accessibility

The `<Card>` element gains `onClick` but is not a `<button>`. Keyboard users reach all actions via the hover buttons (which are focusable `<button>` elements). This is an accepted tradeoff for this MVP — the card's click-to-sheet interaction is mouse/touch only.

## Known Debt

- Hover BUY button uses `hasPrice` only (not `hasPrice && purchasable`). Public assets may incorrectly show a BUY button on hover. Fix is out of scope for this PR.

## Decision Log

| Decision | Rationale |
|---|---|
| Self-contained state in `AssetCard` | Matches existing `PurchaseModal` pattern; no parent changes needed |
| Sheet, not dialog | Right-side sheet feels like a detail panel; less disruptive than a centered modal |
| Keep hover buttons | Quick actions preserved; sheet is additive, not a replacement |
| `stopPropagation` inline on button `onClick` | Handler functions don't accept events; inline wrapper is cleaner than refactoring signatures |
| Close sheet before opening PurchaseModal | Avoids two Radix dialogs open simultaneously; React 18 batches the state updates into one render |
| Sheet closes on DELETE success via `onSuccess` callback | `AssetDetailSheet` does not self-close; `AssetCard` wires the success callback at the callsite |
| Remove `purchasable` gate from `PurchaseModal` | Sheet's BUY condition and `setSheetOpen(false)` sequencing make the gate redundant |
| Use `npx shadcn@latest add sheet` | Gets correct Radix primitives and animations; implementer adjusts to project style |
| Both contexts | Sheet adds value everywhere; no reason to scope it |
