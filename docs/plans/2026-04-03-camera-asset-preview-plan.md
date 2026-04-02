# Camera Asset Preview Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Render camera assets as a studio-backdrop base image + custom line-art SVG overlay instead of raw text content.

**Architecture:** `AssetPreview` detects `asset.type === 'camera'` with no `path` and renders a shared base image (`/public/camera-preview-base.jpg`) with a per-preset SVG overlay (`/public/camera-overlays/{asset.name}.svg`). Missing SVGs show the base image alone with a subtle name label — no broken states.

**Tech Stack:** Next.js `<Image>`, plain `<img>` for SVG overlay, React `useState` for error fallback, Tailwind CSS.

---

### Task 1: Add placeholder base image

**Files:**
- Create: `public/camera-preview-base.jpg` ← placeholder only; user replaces with real studio backdrop

**Step 1: Check if it already exists**

```bash
ls public/camera-preview-base.jpg 2>/dev/null && echo "exists" || echo "missing"
```

**Step 2: Copy any existing photo as temporary placeholder**

Pick any portrait from `public/` or `public/assets/` to use as a stand-in:

```bash
# Example — use whatever image exists in public/
cp public/og-image.png public/camera-preview-base.jpg 2>/dev/null || \
  curl -s -o public/camera-preview-base.jpg \
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVIP/2Q=="
```

> Note: This placeholder will be replaced by the real studio backdrop image the user creates. Any `.jpg` image works for now — the component just needs the file to exist.

**Step 3: Create the overlays directory**

```bash
mkdir -p public/camera-overlays
```

**Step 4: Commit**

```bash
git add public/camera-preview-base.jpg public/camera-overlays/
git commit -m "chore: add camera preview base image placeholder and overlays directory"
```

---

### Task 2: Update AssetPreview component

**Files:**
- Modify: `components/asset-preview.tsx`

**Step 1: Read the current file**

Read `components/asset-preview.tsx` before editing.

**Step 2: Add `useState` import and camera branch**

Replace the full file with this updated version:

```tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Asset } from '@/lib/types'
import { assetUrl, cn } from '@/lib/utils'

type AssetPreviewProps = {
  asset: Asset
} & React.ComponentProps<'div'>

export const AssetPreview = ({ asset, ...props }: AssetPreviewProps) => {
  const [svgError, setSvgError] = useState(false)

  return (
    <div {...props} className={cn(
      'asset-preview relative w-full aspect-square',
      'rounded-3xl overflow-hidden',
      props.className,
    )}>
      {asset.path
        ? (<Image
              src={assetUrl(asset.path)}
              alt={asset.name || 'Asset'}
              fill
              className="object-cover bg-neutral"
              sizes="max-width: 768px) 50vw, 25vw"
            />)
        : asset.type === 'camera'
          ? (<>
              <Image
                src="/camera-preview-base.jpg"
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              {!svgError
                ? (<img
                    src={`/camera-overlays/${asset.name}.svg`}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={() => setSvgError(true)}
                  />)
                : (<div className="absolute inset-0 flex items-end p-3">
                    <span className="text-xs text-white/60">{asset.title || asset.name}</span>
                  </div>)
              }
            </>)
          : (<div className="asset-content flex h-full items-center justify-center p-3">
              <p className="line-clamp-6 text-xs text-muted-foreground">{asset.content}</p>
            </div>)
      }
      {/* Scrim */}
      <div className="absolute inset-x-0 bottom-0 h-24 rounded-b-3xl overflow-hidden bg-linear-to-t from-black/70 to-transparent" />
    </div>
  )
}
```

**Step 3: Verify the build compiles**

```bash
pnpm build 2>&1 | tail -20
```

Expected: no TypeScript errors, clean build.

**Step 4: Commit**

```bash
git add components/asset-preview.tsx
git commit -m "feat: camera asset preview with base image and SVG overlay"
```

---

### Task 3: Add a sample placeholder SVG overlay

**Files:**
- Create: `public/camera-overlays/default.svg` ← used as reference/template for new presets

**Step 1: Create a minimal line-art figure SVG**

This is a standing figure silhouette in line-art style, neutral pose, 9:16 aspect ratio. Use as template when designing new presets.

```bash
cat > public/camera-overlays/default.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 270 480" fill="none">
  <!-- Line art figure — neutral standing pose -->
  <!-- Head -->
  <circle cx="135" cy="80" r="32" stroke="white" stroke-width="2" opacity="0.85"/>
  <!-- Neck -->
  <line x1="135" y1="112" x2="135" y2="135" stroke="white" stroke-width="2" opacity="0.85"/>
  <!-- Shoulders -->
  <path d="M80 145 Q135 130 190 145" stroke="white" stroke-width="2" fill="none" opacity="0.85"/>
  <!-- Torso -->
  <path d="M80 145 L75 260 L135 270 L195 260 L190 145" stroke="white" stroke-width="2" fill="none" opacity="0.85"/>
  <!-- Left arm -->
  <path d="M80 145 L55 220 L60 280" stroke="white" stroke-width="2" fill="none" opacity="0.85"/>
  <!-- Right arm -->
  <path d="M190 145 L215 220 L210 280" stroke="white" stroke-width="2" fill="none" opacity="0.85"/>
  <!-- Left leg -->
  <path d="M105 270 L100 380 L95 460" stroke="white" stroke-width="2" fill="none" opacity="0.85"/>
  <!-- Right leg -->
  <path d="M165 270 L170 380 L175 460" stroke="white" stroke-width="2" fill="none" opacity="0.85"/>
</svg>
EOF
```

**Step 2: Commit**

```bash
git add public/camera-overlays/default.svg
git commit -m "chore: add default camera overlay SVG as design template"
```

---

## Adding New Camera Preset Overlays

When you design a new SVG for a camera preset:

1. Name the file exactly matching `asset.name` in the database — e.g. if `asset.name = 'bokeh'`, file is `public/camera-overlays/bokeh.svg`
2. Use `viewBox="0 0 270 480"` (9:16 portrait ratio)
3. Structure: `<g>` figure layer first, `<g>` effect layer second
4. White strokes on transparent background so the base image shows through
5. Drop the file into `public/camera-overlays/` — no code changes needed

**To find current camera asset names in the database:**

```bash
URL="https://rhxlulctluazrpqzooya.supabase.co"
KEY=$(grep SUPABASE_SERVICE_ROLE_KEY /Users/mike/Work/studio/.env.local | cut -d= -f2)
curl -s "$URL/rest/v1/assets?type=eq.camera&select=name,title" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY" | python3 -m json.tool
```
