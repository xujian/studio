# Motion Gallery Experience - Design Document

**Date:** 2026-02-01
**Scope:** Approach 1 - Fluid Gallery Experience
**Status:** Approved

## Overview

Add Motion (motion.dev) to create a premium, fluid gallery experience for the portrait studio. Focus on making photo interactions feel alive with physics-based animations.

## Goals

- Shared layout animations: Photos smoothly morph from grid to fullscreen viewer
- Magnetic hover: Photos tilt and lift toward cursor with spring physics
- Stagger reveal: New photos cascade into grid with spring timing
- Gesture controls: Swipe to dismiss, backdrop tap to close

## Installation

```bash
pnpm add motion
```

## Architecture

### Component Structure

All Motion components live in `components/`:

- **`moment-view.tsx`** - Fullscreen photo viewer with shared layout animation
- **`magnetic-card.tsx`** - Wrapper for hover tilt/lift effects
- **`stagger-grid.tsx`** - Grid container that staggers children on mount

### Integration Points

**Minimal changes to existing code:**

1. `app/studio/page.tsx`
   - Wrap photo grid with `<StaggerGrid>`
   - Add click handler for fullscreen: `onClick={() => setSelectedPhoto(photo)}`
   - Conditional viewer: `{selectedPhoto && <MomentView photo={selectedPhoto} onClose={...} />}`

2. Individual photos
   - Wrap with `<MagneticCard>` for hover effects
   - Add `layoutId={photo.id}` to photo element
   - Use `<motion.div>` wrapper around Next.js Image

### State Management

Simple React state in `studio/page.tsx`:
- `selectedPhoto` - Currently fullscreen photo (null when closed)
- `MomentView` component manages its own gesture/dismissal state

## Feature Details

### 1. Shared Layout Animations

**How it works:**
- Same photo exists in two places: grid thumbnail and fullscreen viewer
- Both share `layoutId={photo.id}`
- Motion automatically animates position, scale, border-radius between them

**Animation sequence:**
1. User clicks thumbnail → `selectedPhoto` state updates
2. Motion detects matching `layoutId` in grid and viewer
3. Photo morphs from grid position to fullscreen (~400ms spring)
4. Backdrop fades in simultaneously
5. Prompt text fades in after photo settles
6. On close: reverse animation back to grid position

**Performance:** Uses CSS transforms, runs at 60fps.

### 2. Magnetic Hover Effects

**Behavior:**
- Tracks cursor position relative to card center
- Calculates rotation angles (x/y axis) based on cursor distance
- Applies smooth spring physics for natural movement
- Lifts card slightly on hover (translateZ effect)

**Transform values:**
```
Hover: rotateX(-8deg) rotateY(5deg) translateZ(20px)
Rest:  rotateX(0deg) rotateY(0deg) translateZ(0px)
Spring: mass: 0.5, stiffness: 150, damping: 15
```

**Mobile handling:** Automatically skips effect on touch devices (no hover state).

### 3. Stagger Reveal Animation

**Initial load:**
- Photos animate in with 50ms stagger delay
- Start: `opacity: 0, scale: 0.8, y: 20`
- End: `opacity: 1, scale: 1, y: 0`
- Spring: `stiffness: 300, damping: 20`

**New generation added:**
- Single photo pops in at grid start
- More energetic: `stiffness: 400, damping: 15` (bouncier)
- Larger scale start: `scale: 0.6` for emphasis

**Delete:**
- Photo scales down and fades out: `scale: 0.8, opacity: 0` over 200ms
- Grid automatically reflows with layout animation

**Performance:** Only animates elements entering/leaving viewport.

### 4. Gesture Controls

**Swipe to dismiss:**
- Drag photo down to close viewer
- Threshold: 150px downward movement triggers close
- Below threshold: springs back to center
- Visual feedback: photo follows cursor, backdrop opacity decreases

**Backdrop click/tap:**
- Click outside photo to close
- Click on photo = no action

**Keyboard:**
- ESC key closes viewer (accessibility + power users)

**Close animations:**
- Via swipe: continues momentum downward while fading
- Via backdrop/ESC: reverses shared layout animation to grid

**Optional (add later):**
- Pinch to zoom (1x - 3x range)
- Pan when zoomed
- Double-tap to reset zoom

## Edge Cases & Integration

### Loading States
- Show skeleton grid with pulse animation while fetching
- Skeleton items use same `layoutId` - morph to real images when loaded

### Image Loading
- Grid: `loading="lazy"` (Next.js Image)
- Viewer: `priority` for immediate load
- Blur placeholder during load

### Rapid Clicking
- Motion automatically interrupts and starts new animation
- No debouncing needed

### Empty Grid
- "No moments yet" message unchanged
- First generated photo gets emphatic entrance (larger bounce)

### TanStack Query
- Existing `useMoments()` hook provides data
- Motion doesn't interfere with fetching
- `AnimatePresence` works with query cache invalidation

### Browser Compatibility
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Graceful fallback on older browsers (animations skip)
- Mobile Safari: all gestures work

### Performance Safeguards
- `will-change: transform` applied automatically
- GPU acceleration only on animating elements
- Batched DOM reads/writes (no layout thrashing)

### Gotcha
- Next.js Image must be wrapped with `<motion.div>`, not `motion(Image)`

## Coexistence with Existing Animations

Motion handles interactive, physics-based animations. Keep `tailwindcss-animate` for:
- Simple CSS transitions (loading spinners, fade-ins)
- Hover effects that don't need spring physics
- Static entrance animations on non-interactive elements

## Future Enhancements (Approach 2 & 3)

After Approach 1 is complete:
- **Approach 2:** Expressive Producer UI (spring expansion, drag-to-reorder mixins)
- **Approach 3:** Cinematic page transitions (route animations, parallax scrolling)

## Success Criteria

- Photos smoothly morph from grid to fullscreen with no jank
- Hover effects feel tactile and responsive
- New moments cascade in naturally
- Swipe-to-dismiss works smoothly on mobile and desktop
- No performance degradation with 50+ photos in grid
- Animations enhance experience without feeling gimmicky

## Implementation Notes

- Start with `moment-view.tsx` (shared layout animation) - this is the "wow" feature
- Add `stagger-grid.tsx` next (easy win, immediate visual impact)
- `magnetic-card.tsx` can be optional/progressive enhancement
- Gestures can be added incrementally (start with backdrop click, add swipe later)
