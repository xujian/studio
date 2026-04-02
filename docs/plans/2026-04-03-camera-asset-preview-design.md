# Camera Asset Preview — Design

**Date:** 2026-04-03
**Status:** Approved

## Problem

Camera assets are text-only (no `path`). `AssetPreview` falls back to showing raw text content, which looks out of place next to image-based assets (face, style, etc.). Camera concepts like "bokeh" or "film grain" are also abstract — text alone doesn't communicate the effect.

## Solution

Each camera asset gets a custom SVG illustration overlaid on a shared base scene image. The SVG contains a line-art figure and an effect layer that visually simulates the camera concept.

## Design Decisions

### Base image
- Single neutral scene — empty environment (studio backdrop or minimal room), no figure
- Stored at `/public/camera-preview-base.jpg`
- One image serves all presets; individual presets may override with a second base if needed

### SVG overlay
- Custom hand-crafted per preset — quality is curated, not generated
- Stored at `/public/camera-overlays/{asset.name}.svg`
- Keyed by `asset.name` (the stable slug, e.g. `bokeh`, `cinematic-wide`, `film-grain`)
- Structure:
  ```
  <svg>
    <g class="figure">   ← line art figure, consistent style across all presets </g>
    <g class="effect">   ← effect illustration unique per preset </g>
  </svg>
  ```
- Figure style: **line art** — outlined strokes, minimal fill, works naturally with SVG

### Effect examples by preset type
- Bokeh → soft unfocused circles scattered around figure
- Shallow DOF → sharp figure, radial blur lines toward edges
- Wide angle → perspective/distortion lines emanating from center
- Telephoto → compression grid lines, tight framing marks
- Film grain → `feTurbulence` SVG filter overlay

### Fallback
- If no SVG exists for `asset.name`, show a generic tinted placeholder
- Prevents broken card states during development

## Component Change

`AssetPreview` adds a new branch for `asset.type === 'camera'` with no `path`:

```tsx
} : asset.type === 'camera' ? (
  <div className="relative w-full h-full">
    <Image src="/camera-preview-base.jpg" fill className="object-cover" alt="" />
    <img
      src={`/camera-overlays/${asset.name}.svg`}
      className="absolute inset-0 w-full h-full"
    />
  </div>
) : (
  // existing text fallback
```

## Rejected Alternatives

- **Diagrammatic overlays** — too technical/clinical, sacrifices aesthetics
- **Annotation-style overlays** — looks like a manual, not a product
- **Systematic/generated SVGs** — scales automatically but loses quality control
- **SVG as the only layer (no base image)** — loses the grounded, photographic feel
- **Figure in the base image** — can't vary or stylize the figure per preset without multiple base images

## Resolved Questions

- **Base scene:** studio backdrop — neutral, clean, works for all camera concepts
- **Figure pose:** one consistent pose across all presets — simpler to maintain, stronger visual identity
