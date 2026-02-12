# Store Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a store page where users browse official assets grouped by type, preview them, and purchase with credits.

**Architecture:** Grouped sections page (one per asset type), each showing a 4-card grid preview with "See all" expand. Two new Supabase RPC functions handle data fetching and atomic purchases. TanStack Query hooks manage client state with optimistic updates.

**Tech Stack:** Next.js 16, TanStack Query, Supabase RPC, Tailwind CSS, Shadcn UI, motion/react, sonner toast, lucide-react icons

---

### Task 1: Supabase RPC — `get_store_assets`

**Files:**
- Modify: `supabase/schema.sql` (append after `get_user_assets` function, ~line 386)

**Step 1: Write the SQL function**

Add to `supabase/schema.sql`:

```sql
-- Function to get all public store assets with purchase status for a user
CREATE OR REPLACE FUNCTION get_store_assets(user_uuid uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  name text,
  title text,
  description text,
  type text,
  url text,
  content text,
  is_public boolean,
  price integer,
  created_at timestamptz,
  is_purchased boolean
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    a.id, a.user_id, a.name, a.title, a.description,
    a.type, a.url, a.content, a.is_public, a.price, a.created_at,
    EXISTS (
      SELECT 1 FROM public.purchases p
      WHERE p.asset_id = a.id AND p.buyer_id = user_uuid
    ) AS is_purchased
  FROM public.assets a
  WHERE a.is_public = true
  ORDER BY a.type, a.created_at DESC;
$$;
```

**Step 2: Run the SQL in Supabase**

Run the function in Supabase SQL Editor to deploy it.

**Step 3: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add get_store_assets RPC function"
```

---

### Task 2: Supabase RPC — `purchase_asset`

**Files:**
- Modify: `supabase/schema.sql` (append after `get_store_assets`)

**Step 1: Write the SQL function**

Add to `supabase/schema.sql`:

```sql
-- Function to purchase an asset atomically
-- Validates credits, inserts purchase (triggers credit deduction via existing trigger)
CREATE OR REPLACE FUNCTION purchase_asset(asset_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_asset public.assets;
  v_credits integer;
BEGIN
  -- Get the asset
  SELECT * INTO v_asset FROM public.assets WHERE id = asset_uuid;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Asset not found');
  END IF;

  -- Must be a public asset with a price
  IF v_asset.is_public IS NOT TRUE OR v_asset.price IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Asset is not for sale');
  END IF;

  -- Check if already purchased
  IF EXISTS (SELECT 1 FROM public.purchases WHERE buyer_id = v_user_id AND asset_id = asset_uuid) THEN
    RETURN json_build_object('success', false, 'error', 'Already purchased');
  END IF;

  -- Check credits
  SELECT credits INTO v_credits FROM public.profiles WHERE id = v_user_id;
  IF v_credits < v_asset.price THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient credits');
  END IF;

  -- Insert purchase (existing trigger handles credit deduction + transaction logging)
  INSERT INTO public.purchases (buyer_id, asset_id, price)
  VALUES (v_user_id, asset_uuid, v_asset.price);

  RETURN json_build_object('success', true, 'remaining_credits', v_credits - v_asset.price);
END;
$$;
```

**Step 2: Run the SQL in Supabase**

Run the function in Supabase SQL Editor to deploy it.

**Step 3: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add purchase_asset RPC function"
```

---

### Task 3: `useStore` Hook

**Files:**
- Create: `hooks/use-store.ts`

**Step 1: Write the hook**

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { AssetWithPurchaseInfo, AssetType } from '@/lib/types'
import { assetTypes } from '@/lib/constants'

export type StoreSection = {
  type: AssetType
  name: string
  assets: AssetWithPurchaseInfo[]
}

export const useStore = () => {
  const supabase = createClient()

  return useQuery({
    queryKey: ['store'],
    queryFn: async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      const userId = session?.user?.id ?? '00000000-0000-0000-0000-000000000000'

      const { data, error } = await supabase.rpc('get_store_assets', {
        user_uuid: userId
      })

      if (error) throw error

      const assets = (data || []) as AssetWithPurchaseInfo[]

      // Group by type, preserving assetTypes order
      const sections: StoreSection[] = assetTypes
        .map(t => ({
          type: t.type as AssetType,
          name: t.name,
          assets: assets.filter(a => a.type === t.type)
        }))
        .filter(s => s.assets.length > 0)

      return sections
    },
    staleTime: 5 * 60 * 1000
  })
}
```

**Step 2: Commit**

```bash
git add hooks/use-store.ts
git commit -m "feat: add useStore hook for store assets"
```

---

### Task 4: `usePurchase` Hook

**Files:**
- Create: `hooks/use-purchase.ts`

**Step 1: Write the hook**

```typescript
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export const usePurchase = () => {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (assetId: string) => {
      const { data, error } = await supabase.rpc('purchase_asset', {
        asset_uuid: assetId
      })

      if (error) throw error

      const result = data as { success: boolean; error?: string; remaining_credits?: number }
      if (!result.success) {
        throw new Error(result.error || 'Purchase failed')
      }

      return result
    },
    onSuccess: () => {
      toast.success('Asset purchased!')
      queryClient.invalidateQueries({ queryKey: ['store'] })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}
```

**Step 2: Commit**

```bash
git add hooks/use-purchase.ts
git commit -m "feat: add usePurchase mutation hook"
```

---

### Task 5: `StoreCard` Component

**Files:**
- Create: `components/store-card.tsx`

**Step 1: Write the component**

```tsx
'use client'

import Image from 'next/image'
import { Check, Coins } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui'
import { Peekable } from '@/components/peekable'
import { usePurchase } from '@/hooks/use-purchase'
import type { AssetWithPurchaseInfo } from '@/lib/types'
import { cn } from '@/lib/utils'

interface StoreCardProps {
  asset: AssetWithPurchaseInfo
}

export function StoreCard({ asset }: StoreCardProps) {
  const purchase = usePurchase()
  const isOwned = asset.is_purchased
  const hasImage = !!asset.url

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!asset.id || isOwned) return
    purchase.mutate(asset.id)
  }

  const card = (
    <div className={cn(
      'group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-all hover:elevation-2',
      isOwned && 'border-primary/30'
    )}>
      {/* Preview area */}
      <div className="relative aspect-[9/16] w-full overflow-hidden bg-black">
        {hasImage ? (
          <Image
            src={asset.url!}
            alt={asset.name || 'Asset'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3">
            <p className="line-clamp-6 text-xs text-neutral-400">
              {asset.content}
            </p>
          </div>
        )}

        {/* Owned badge */}
        {isOwned && (
          <div className="absolute top-2 right-2">
            <Badge variant="default" className="gap-1 bg-primary/90 text-xs">
              <Check className="size-3" />
              Owned
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 p-2">
        <p className="truncate text-sm font-medium">{asset.title || asset.name}</p>

        {/* Price / Buy */}
        {!isOwned && asset.price != null && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleBuy}
            disabled={purchase.isPending}
            className="mt-1 w-full gap-1 text-xs cursor-pointer"
          >
            <Coins className="size-3" />
            {purchase.isPending ? '...' : `${asset.price} credits`}
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <Peekable
      content={asset.url || asset.content || asset.name || ''}
      title={asset.title || asset.name}
      description={asset.description}
    >
      {card}
    </Peekable>
  )
}
```

**Step 2: Commit**

```bash
git add components/store-card.tsx
git commit -m "feat: add StoreCard component"
```

---

### Task 6: `StoreGrid` Component

**Files:**
- Modify: `components/store-grid.tsx` (replace empty stub)

**Step 1: Write the component**

```tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronRight } from 'lucide-react'
import { StoreCard } from '@/components/store-card'
import { Skeleton } from '@/components/ui/skeleton'
import { useStore, type StoreSection } from '@/hooks/use-store'
import { cn } from '@/lib/utils'

const PREVIEW_COUNT = 4

function SectionHeader({
  section,
  expanded,
  onToggle
}: {
  section: StoreSection
  expanded: boolean
  onToggle: () => void
}) {
  const hasMore = section.assets.length > PREVIEW_COUNT
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg font-semibold">{section.name}</h2>
      {hasMore && (
        <button
          onClick={onToggle}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {expanded ? 'Show less' : 'See all'}
          <ChevronRight className={cn(
            'size-4 transition-transform',
            expanded && 'rotate-90'
          )} />
        </button>
      )}
    </div>
  )
}

function StoreSection({ section }: { section: StoreSection }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? section.assets : section.assets.slice(0, PREVIEW_COUNT)

  return (
    <section className="mb-10">
      <SectionHeader
        section={section}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
      />
      <motion.div
        layout
        className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
      >
        <AnimatePresence mode="popLayout">
          {visible.map(asset => (
            <motion.div
              key={asset.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <StoreCard asset={asset} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  )
}

function StoreSkeleton() {
  return (
    <div className="space-y-10">
      {[1, 2, 3].map(i => (
        <div key={i}>
          <Skeleton className="h-6 w-24 mb-3" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="aspect-[9/16] w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function StoreGrid() {
  const { data: sections, isLoading, error } = useStore()

  if (isLoading) return <StoreSkeleton />

  if (error) {
    return (
      <div className="text-destructive">
        Failed to load store: {error.message}
      </div>
    )
  }

  if (!sections || sections.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-20">
        No assets available yet
      </div>
    )
  }

  return (
    <div>
      {sections.map(section => (
        <StoreSection key={section.type} section={section} />
      ))}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/store-grid.tsx
git commit -m "feat: build StoreGrid with grouped sections"
```

---

### Task 7: Update Store Page

**Files:**
- Modify: `app/store/page.tsx`

**Step 1: Update the page**

```tsx
import { StoreGrid } from '@/components/store-grid'

export default function StorePage() {
  return (
    <section className="flex w-full flex-col px-16 pb-16 pt-2">
      <h1 className="mb-6 text-2xl font-semibold">Store</h1>
      <StoreGrid />
    </section>
  )
}
```

**Step 2: Verify the page renders**

Run: `pnpm dev` and navigate to `/store`. Verify:
- Loading skeletons appear
- Sections render grouped by asset type
- Cards show image/text previews
- "See all" / "Show less" toggles work
- Peekable preview on hover
- Buy button works (if test assets exist)
- Owned assets show checkmark badge

**Step 3: Commit**

```bash
git add app/store/page.tsx
git commit -m "feat: update store page layout"
```

---

### Task 8: Verify End-to-End

**Step 1: Seed test data (if needed)**

If no public assets exist, insert test assets via Supabase SQL Editor:

```sql
INSERT INTO assets (name, title, description, type, content, is_public, price) VALUES
  ('casual-summer', 'Casual Summer', 'Light summer outfit with shorts and tank top', 'outfit', 'casual summer outfit with denim shorts, white tank top, and sandals', true, 2),
  ('evening-gown', 'Evening Gown', 'Elegant evening dress', 'outfit', 'elegant floor-length evening gown in deep red with subtle shimmer', true, 3),
  ('beach-sunset', 'Beach Sunset', 'Golden hour beach scene', 'scene', 'tropical beach at golden hour, warm sunlight, gentle waves, palm trees', true, 2),
  ('studio-light', 'Studio Lighting', 'Professional studio setup', 'lighting', 'professional studio lighting with softbox key light, rim light, and fill', true, 1);
```

**Step 2: Test the full flow**

1. Navigate to `/store`
2. Verify sections appear for types with assets
3. Click "Buy" on an asset
4. Verify toast appears
5. Verify card updates to show "Owned" badge
6. Navigate to `/studio` and verify the asset appears in the face-picker / mixins

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete store page with browse and purchase"
```
