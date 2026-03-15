# AssetCard Detail Sheet — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `AssetCard` clickable so it opens a right-side sheet showing full asset details and actions.

**Architecture:** Self-contained sheet state in `AssetCard` (mirrors existing `PurchaseModal` pattern). A new `Sheet` UI primitive wraps `@radix-ui/react-dialog` with slide-from-right positioning. A new `AssetDetailSheet` component renders the sheet content. `AssetCard` gains `sheetOpen` state, card-level `onClick`, and `stopPropagation` on hover buttons.

**Tech Stack:** Next.js 16, React 18, `@radix-ui/react-dialog` (already installed), Tailwind CSS, Shadcn UI conventions

**Spec:** `docs/superpowers/specs/2026-03-15-asset-card-sheet-design.md`

**No test framework** — verification is visual (dev server at `https://kanojostudio.io`).

---

## Chunk 1: Sheet UI primitive

### Task 1: Scaffold `components/ui/sheet.tsx`

**Files:**
- Create: `components/ui/sheet.tsx`

- [ ] **Step 1: Run shadcn to scaffold the sheet component**

```bash
npx shadcn@latest add sheet
```

This creates `components/ui/sheet.tsx`. Accept any prompts to overwrite.

- [ ] **Step 2: Adjust generated file to match project style**

Open `components/ui/sheet.tsx`. Apply these style rules (see `docs/CODING_STYLE.md`):
- Remove all semicolons
- Change double quotes to single quotes
- Convert `function Foo()` declarations to `const Foo = () =>` arrow functions
- Keep all existing logic and exports intact

The final file should export: `Sheet`, `SheetTrigger`, `SheetClose`, `SheetPortal`, `SheetOverlay`, `SheetContent`, `SheetHeader`, `SheetFooter`, `SheetTitle`, `SheetDescription`.

- [ ] **Step 3: Verify the file compiles**

```bash
cd /Users/mike/Work/studio && pnpm build 2>&1 | head -30
```

Expected: no TypeScript errors in `components/ui/sheet.tsx`. Fix any before continuing.

- [ ] **Step 4: Commit**

```bash
git add components/ui/sheet.tsx
git commit -m "feat: add Sheet UI primitive"
```

---

## Chunk 2: AssetDetailSheet component

### Task 2: Build `components/asset-detail-sheet.tsx`

**Files:**
- Create: `components/asset-detail-sheet.tsx`
- Reference: `components/purchase.tsx` (similar layout — image hero, info panel, action buttons)
- Reference: `lib/types.ts` (`AssetWithPurchaseInfo`, `Asset`)
- Reference: `lib/utils.ts` (`assetUrl`, `cn`)
- Reference: `components/ui/sheet.tsx` (just created)
- Reference: `components/price.tsx` (`variant="button"` for price display)

**Key design notes:**
- `Button` imported from `'@/components/ui/button'` (not `'@/components/button'`) — the sheet doesn't need tooltip support
- Delete mutation loading state (`isDeleting`) is passed as a prop from `AssetCard` — the sheet does NOT own any mutations
- Price shown once only: `variant="button"` row in the actions panel (not duplicated in the hero)

- [ ] **Step 1: Create `components/asset-detail-sheet.tsx`**

```tsx
'use client'

import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import { Price } from '@/components/price'
import { assetUrl } from '@/lib/utils'
import type { AssetWithPurchaseInfo } from '@/lib/types'
import { Check, Loader2 } from 'lucide-react'

type AssetDetailSheetProps = {
  asset: AssetWithPurchaseInfo
  open: boolean
  onOpenChange: (open: boolean) => void
  hasPrice?: boolean
  isDeleting?: boolean
  onBuy: () => void
  onUse: () => void
  onDelete: () => void
}

export function AssetDetailSheet({
  asset,
  open,
  onOpenChange,
  hasPrice,
  isDeleting,
  onBuy,
  onUse,
  onDelete,
}: AssetDetailSheetProps) {
  const isPublic = !!asset.is_public
  const isPurchased = !!asset.is_purchased
  const isCustom = !isPublic && !isPurchased
  const canUse = isPublic || isPurchased || isCustom
  const purchasable = !isPublic && !isPurchased
  const deletable = isPurchased || isCustom

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-sm">
        <SheetTitle className="sr-only">{asset.title || asset.name}</SheetTitle>

        {/* Hero */}
        <div className="relative aspect-square w-full overflow-hidden bg-black">
          {asset.path ? (
            <Image
              src={assetUrl(asset.path)}
              alt={asset.name || 'Asset'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 480px"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-neutral-950 p-10">
              <p className="text-center text-sm leading-relaxed text-neutral-300">
                {asset.content}
              </p>
            </div>
          )}

          {/* Scrim */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/70 to-transparent" />

          {/* Badges overlay */}
          <div className="absolute right-3 bottom-3 left-3 flex items-end justify-between">
            <Badge className="border-white/20 bg-white/10 text-[10px] tracking-widest text-white uppercase backdrop-blur-sm">
              {asset.type}
            </Badge>
            {isPurchased ? (
              <Badge className="gap-1 bg-primary/90 text-xs">
                <Check className="size-3" />
                Owned
              </Badge>
            ) : isCustom ? (
              <Badge variant="secondary" className="text-xs">Custom</Badge>
            ) : null}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold leading-tight">
              {asset.title || asset.name}
            </h2>
            {asset.name && asset.title && (
              <p className="text-xs text-muted-foreground">{asset.name}</p>
            )}
            {asset.description && (
              <p className="text-sm leading-snug text-muted-foreground">
                {asset.description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto flex flex-col gap-2 p-4 pt-0">
          {hasPrice && asset.price != null && (
            <Price value={asset.price} variant="button" />
          )}
          {canUse && (
            <Button className="w-full rounded-full" onClick={onUse}>
              Use
            </Button>
          )}
          {hasPrice && purchasable && (
            <Button
              className="w-full rounded-xl bg-green-500 hover:bg-green-700"
              onClick={onBuy}>
              Buy
            </Button>
          )}
          {deletable && (
            <Button
              variant="destructive"
              className="w-full rounded-xl"
              disabled={isDeleting}
              onClick={onDelete}>
              {isDeleting ? <Loader2 className="size-4 animate-spin" /> : 'Delete'}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: Verify the file compiles**

```bash
cd /Users/mike/Work/studio && pnpm build 2>&1 | head -40
```

Expected: no TypeScript errors referencing `asset-detail-sheet.tsx`. Fix any before continuing.

- [ ] **Step 3: Commit**

```bash
git add components/asset-detail-sheet.tsx
git commit -m "feat: add AssetDetailSheet component"
```

---

## Chunk 3: Wire AssetCard

### Task 3: Update `components/asset-card.tsx`

**Files:**
- Modify: `components/asset-card.tsx`
- Reference: `docs/superpowers/specs/2026-03-15-asset-card-sheet-design.md` (dialog sequencing section)

Current state of the file (key parts):
- Line 23: `useDeleteAsset` and `useRemovePurchase` already imported and instantiated — `isDeleting` derived from their `.isPending` flags and passed as a prop to the sheet
- Line 25: `const [modalOpen, setModalOpen] = useState(false)` — add `sheetOpen` next to this
- Line 49: `<Card className="asset-card group ...">` — add `onClick`
- Lines 80-98: hover buttons — add `stopPropagation` wrappers
- Line 110: `{purchasable && (<PurchaseModal .../>)}` — remove `purchasable` gate

- [ ] **Step 1: Add `sheetOpen` state and `isDeleting` flag**

In `components/asset-card.tsx`, find:
```tsx
const [modalOpen, setModalOpen] = useState(false)
```
Replace with:
```tsx
const [modalOpen, setModalOpen] = useState(false)
const [sheetOpen, setSheetOpen] = useState(false)
const isDeleting = deleteAsset.isPending || removePurchase.isPending
```

- [ ] **Step 2: Add card-level onClick**

Find:
```tsx
<Card className="asset-card group gap-0 p-0 transition-all cursor-pointer border-0">
```
Replace with:
```tsx
<Card className="asset-card group gap-0 p-0 transition-all cursor-pointer border-0" onClick={() => setSheetOpen(true)}>
```

- [ ] **Step 3: Add stopPropagation to hover buttons**

Find the BUY button onClick:
```tsx
onClick={handleBuy}
```
Replace with:
```tsx
onClick={(e) => { e.stopPropagation(); handleBuy() }}
```

Find the USE button onClick:
```tsx
onClick={() => handleUse(data as AssetWithPurchaseInfo)}
```
Replace with:
```tsx
onClick={(e) => { e.stopPropagation(); handleUse(data as AssetWithPurchaseInfo) }}
```

Find the DELETE button onClick:
```tsx
onClick={() => handleDelete(data as AssetWithPurchaseInfo)}
```
Replace with:
```tsx
onClick={(e) => { e.stopPropagation(); handleDelete(data as AssetWithPurchaseInfo) }}
```

- [ ] **Step 4: Remove `purchasable` gate from PurchaseModal**

Find:
```tsx
{purchasable && (
  <PurchaseModal asset={data as AssetWithPurchaseInfo} open={modalOpen} onOpenChange={setModalOpen} />
)}
```
Replace with:
```tsx
<PurchaseModal asset={data as AssetWithPurchaseInfo} open={modalOpen} onOpenChange={setModalOpen} />
```

- [ ] **Step 5: Add AssetDetailSheet import and render**

Add import at the top of the file alongside other imports:
```tsx
import { AssetDetailSheet } from '@/components/asset-detail-sheet'
```

In the fragment, after `<PurchaseModal .../>` and before the closing `</>`, add:
```tsx
      <AssetDetailSheet
        asset={data as AssetWithPurchaseInfo}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        hasPrice={hasPrice}
        isDeleting={isDeleting}
        onBuy={() => { setSheetOpen(false); setModalOpen(true) }}
        onUse={() => handleUse(data as AssetWithPurchaseInfo)}
        onDelete={() => {
          if ((data as AssetWithPurchaseInfo).is_purchased) {
            removePurchase.mutate(data.id!, { onSuccess: () => setSheetOpen(false) })
          } else {
            deleteAsset.mutate({ id: data.id!, path: data.path }, { onSuccess: () => setSheetOpen(false) })
          }
        }}
      />
```

- [ ] **Step 6: Verify full build passes**

```bash
cd /Users/mike/Work/studio && pnpm build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully` with no errors. Fix any TypeScript errors before continuing.

- [ ] **Step 7: Manual smoke test**

Start the dev server:
```bash
sudo pnpm dev
```

Open `https://kanojostudio.io/store` and verify:
1. Clicking a card body (not a button) opens the sheet from the right
2. Sheet shows asset image (or text content), badges, title, description, price, action buttons
3. Hover buttons still work — USE/BUY/DELETE on hover do NOT open the sheet
4. BUY inside the sheet closes the sheet and opens the purchase modal
5. DELETE inside the sheet closes the sheet after the asset is removed and shows a loading spinner during deletion

Open `https://kanojostudio.io/studio` → open Assets Manager for any type and verify the same behavior.

- [ ] **Step 8: Commit**

```bash
git add components/asset-card.tsx
git commit -m "feat: make AssetCard clickable to open detail sheet"
```
