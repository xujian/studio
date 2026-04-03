# Ad-hoc Mixins Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an inline ad-hoc entry form to each mixin type popover so users can enter one-off text or upload an image without saving a named asset.

**Architecture:** All UI lives inside `Mixins.tsx` (no new files). `useCreateAsset` is updated to return the inserted record so the new asset can be auto-selected immediately. `AssetsManager` filters out ad-hoc assets (`name === ""`) from the library grid.

**Tech Stack:** React (hooks, controlled Popover), TanStack Query mutation, Supabase insert, existing `<Upload>` + `<Tabs>` components, `removeAssetImage` utility.

**Design doc:** `docs/plans/2026-04-03-ad-hoc-mixins-design.md`

---

### Task 1: Return the created asset from `useCreateAsset`

The ad-hoc save flow needs the new asset's ID to auto-select it. Currently `useCreateAsset` returns `void`. Update it to return the full asset record.

**Files:**
- Modify: `hooks/use-create-asset.ts`

**Step 1: Update the mutationFn to return the inserted row**

Change this block:
```ts
const { error } = await supabase
  .from('assets')
  .insert({ user_id: session.user.id, name, title: title || undefined, ... })
if (error) throw error
```

To:
```ts
const { data, error } = await supabase
  .from('assets')
  .insert({ user_id: session.user.id, name, title: title || undefined, description: description || undefined, content: content || undefined, type, path: path || null })
  .select()
  .single()
if (error) throw error
return data as import('@/lib/types').Asset
```

**Step 2: Verify the change compiles**

```bash
pnpm build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no TypeScript errors related to `use-create-asset.ts`.

**Step 3: Commit**

```bash
git add hooks/use-create-asset.ts
git commit -m "feat: return created asset from useCreateAsset"
```

---

### Task 2: Filter ad-hoc assets from `AssetsManager`

Assets with `name === ""` are ad-hoc and must not appear in the library grid.

**Files:**
- Modify: `components/assets-manager.tsx:21`

**Step 1: Add the filter**

Change line 21:
```ts
const filtered = assets.filter(a => a.type === type)
```

To:
```ts
const filtered = assets.filter(a => a.type === type && a.name !== '')
```

**Step 2: Verify build**

```bash
pnpm build 2>&1 | grep -E "error|Error" | head -20
```

**Step 3: Commit**

```bash
git add components/assets-manager.tsx
git commit -m "feat: hide ad-hoc assets from AssetsManager"
```

---

### Task 3: Add controlled Popover state to `Mixins.tsx`

To close a popover programmatically after save, it must be controlled. Add `openType` state and wire it up. No visible behavior change yet.

**Files:**
- Modify: `components/mixins.tsx`

**Step 1: Add imports**

Add to the existing import block:
```ts
import { removeAssetImage } from '@/lib/utils'
import { useCreateAsset } from '@/hooks/use-create-asset'
import { Textarea } from '@/components/ui/textarea'
import { Upload } from '@/components/upload'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
```

**Step 2: Add state + mutation inside the `Mixins` function, after the existing `assetsByType` memo**

```ts
const [openType, setOpenType] = React.useState<AssetType | null>(null)
const [adHocType, setAdHocType] = React.useState<AssetType | null>(null)
const [adHocTab, setAdHocTab] = React.useState<'text' | 'image'>('text')
const [adHocContent, setAdHocContent] = React.useState('')
const [adHocPath, setAdHocPath] = React.useState('')
const createAsset = useCreateAsset()

const resetAdHoc = () => {
  if (adHocPath) removeAssetImage(adHocPath)
  setAdHocType(null)
  setAdHocTab('text')
  setAdHocContent('')
  setAdHocPath('')
}
```

**Step 3: Make each `<Popover>` controlled**

Change:
```tsx
<Popover key={d.id} modal={false}>
```

To:
```tsx
<Popover
  key={d.id}
  modal={false}
  open={openType === d.id}
  onOpenChange={(open) => {
    if (!open) resetAdHoc()
    setOpenType(open ? d.id as AssetType : null)
  }}>
```

**Step 4: Make the trigger button still work**

The `PopoverTrigger` button is unchanged — clicking it fires `onOpenChange(true)` automatically via Radix.

**Step 5: Verify build + popover still opens/closes normally**

```bash
pnpm build 2>&1 | grep -E "error|Error" | head -20
```

Open the dev server (`sudo pnpm dev`) and confirm each mixin popover still opens and closes.

**Step 6: Commit**

```bash
git add components/mixins.tsx
git commit -m "refactor: make Mixins popovers controlled"
```

---

### Task 4: Add the ad-hoc form inside each popover

**Files:**
- Modify: `components/mixins.tsx`

**Step 1: Add the `handleAdHocSave` function inside `Mixins`, after `resetAdHoc`**

```ts
const handleAdHocSave = (type: AssetType) => {
  createAsset.mutate(
    {
      name: '',
      type,
      content: adHocTab === 'text' ? adHocContent || undefined : undefined,
      path: adHocTab === 'image' ? adHocPath || null : null,
    },
    {
      onSuccess: (asset) => {
        handleSelect(type, asset.id!)
        setOpenType(null)
        resetAdHoc()
      }
    }
  )
}
```

**Step 2: Add the "Ad-hoc" button at the bottom of each asset list**

Inside the `<div data-lenis-prevent-wheel ...>`, after the `typeAssets.map(...)` block (and after the loading/empty states), add:

```tsx
<Button
  type="button"
  variant="ghost"
  size="sm"
  className="mt-1 w-full justify-start text-xs text-muted-foreground"
  onClick={() => setAdHocType(d.id as AssetType)}>
  + Ad-hoc
</Button>
```

**Step 3: Wrap the existing list content + add the ad-hoc form view**

Replace the entire `<div data-lenis-prevent-wheel ...>` block with:

```tsx
{adHocType === d.id ? (
  <div className="flex w-full flex-col gap-2 pr-2">
    <button
      type="button"
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      onClick={resetAdHoc}>
      ← back
    </button>
    <Tabs
      value={adHocTab}
      onValueChange={(v) => {
        if (v === 'text' && adHocPath) {
          removeAssetImage(adHocPath)
          setAdHocPath('')
        }
        setAdHocTab(v as 'text' | 'image')
      }}>
      <TabsList className="h-7 w-full">
        <TabsTrigger value="text" className="flex-1 text-xs">Text</TabsTrigger>
        <TabsTrigger value="image" className="flex-1 text-xs">Image</TabsTrigger>
      </TabsList>
      <TabsContent value="text">
        <Textarea
          autoFocus
          rows={4}
          placeholder={`Describe the ${d.id}...`}
          value={adHocContent}
          onChange={e => setAdHocContent(e.target.value)}
          className="text-xs" />
      </TabsContent>
      <TabsContent value="image">
        <Upload
          path={({ userId }) => `assets/${userId}/${d.id}`}
          value={adHocPath ? assetUrl(adHocPath) : undefined}
          onComplete={setAdHocPath}
          onClear={() => setAdHocPath('')}
          className="aspect-video w-full" />
      </TabsContent>
    </Tabs>
    <Button
      type="button"
      size="sm"
      className="w-full"
      disabled={
        createAsset.isPending ||
        (adHocTab === 'text' && !adHocContent.trim()) ||
        (adHocTab === 'image' && !adHocPath)
      }
      onClick={() => handleAdHocSave(d.id as AssetType)}>
      {createAsset.isPending ? 'Saving…' : 'Save'}
    </Button>
  </div>
) : (
  <div
    data-lenis-prevent-wheel
    className="flex max-h-60 flex-col items-start justify-start gap-1 overflow-y-auto">
    {isLoading ? (
      <div className="p-2 text-xs text-muted-foreground">Loading...</div>
    ) : typeAssets.length === 0 ? (
      <div className="p-2 text-xs text-muted-foreground">No {d.id} assets yet</div>
    ) : (
      typeAssets.map(a => (
        <Peekable
          key={a.id}
          content={a.path ? assetUrl(a.path!) : () => (<AssetPreview asset={a} />)}
          title={a.title}
          description={a.description}
          side="right"
          align="start"
          offset={100}>
          <div>
            <Toggle
              variant="outline"
              size="sm"
              className="mixin h-5 justify-start"
              pressed={value[a.type] === a.id}
              onPressedChange={() => handleSelect(a.type, a.id!)}>
              <span className="truncate text-xs">{a.name}</span>
            </Toggle>
          </div>
        </Peekable>
      ))
    )}
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="mt-1 w-full justify-start text-xs text-muted-foreground"
      onClick={() => setAdHocType(d.id as AssetType)}>
      + Ad-hoc
    </Button>
  </div>
)}
```

**Step 4: Filter ad-hoc assets out of the mixin list**

Ad-hoc assets (`name === ""`) should not appear in the toggles list (they're already auto-selected by ID, no need to re-list them).

Change:
```ts
const typeAssets = assetsByType[d.id] || []
```

To:
```ts
const typeAssets = (assetsByType[d.id] || []).filter(a => a.name !== '')
```

**Step 5: Verify build**

```bash
pnpm build 2>&1 | grep -E "error|Error" | head -20
```

**Step 6: Manual test**

1. Open studio → click any mixin type button (e.g. "outfit")
2. Confirm asset list shows with "+ Ad-hoc" at the bottom
3. Click "+ Ad-hoc" → list hides, form appears with Text/Image tabs and "← back"
4. Text tab: type some text → "Save" enables → click Save → popover closes, mixin slot highlights as selected
5. Click the mixin button again → ad-hoc asset does NOT appear in the list (it's selected by ID but not listed)
6. Click "← back" without saving → returns to list, no orphaned uploads
7. Image tab: upload an image → Save → same auto-select behavior

**Step 7: Commit**

```bash
git add components/mixins.tsx
git commit -m "feat: ad-hoc mixin entry inline in popover"
```

---

### Task 5: Verify generation uses ad-hoc asset correctly

Ad-hoc assets go through the same `mixins` → `Assets` resolution path as any other asset. Verify end-to-end.

**Step 1: Manual test**

1. Select an ad-hoc text mixin (e.g. outfit: "flowing red dress")
2. Generate a photo
3. Confirm the generation reflects the ad-hoc content
4. Check Supabase `assets` table: confirm the row has `name = ""` and the correct `content`

**Step 2: Verify ad-hoc assets are hidden from AssetsManager**

1. Open the asset library (sidebar → Assets)
2. Navigate to the outfit type
3. Confirm no asset with an empty name appears

---

### Done

All tasks complete. The ad-hoc mixin flow is fully implemented:
- Inline form in each mixin popover (Text / Image tabs)
- Creates an asset with `name = ""`, auto-selects it, closes popover
- Hidden from AssetsManager library grid
- No new files added
