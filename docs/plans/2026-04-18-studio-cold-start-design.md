# Studio Cold Start — Design

**Problem:** New users who register and land on `/studio` see a blank page with two lines of text before their first generation. No visual inspiration, no guidance on how to use the Producer bar.

**Goal:** Give new users an aspirational welcome board (one example portrait + prompt chips) and a 3-step coach-mark sequence that teaches the Producer bar on first visit.

---

## Two Parts

### 1. Welcome Board (`<StudioWelcome />`)

Shown when `allMoments.length === 0 && !isLoading`. Disappears automatically after the first generation.

- One static example portrait image (`/public/examples/portrait.jpg`) — centered, prominent, styled like a print
- Headline: "Your studio starts here"
- Subline: "Pick a face, describe the mood, generate your first portrait."
- Three prompt chips — clicking one emits `prompt:prefill` bus event, which Producer listens to and sets its textarea

**Prompt chips:**
- "Cinematic street portrait, golden hour"
- "Studio headshot, clean white background"  
- "Dreamy outdoor portrait, soft bokeh"

### 2. Coach-mark Sequence (`<StudioCoachMarks />`)

Shown on first visit to `/studio`. Reads `localStorage.getItem('kanojo:onboarded')` — if set, renders nothing.

Three sequential steps, each a floating tooltip with a pulse beacon pointing at a Producer element:

| Step | Target | Text | Advances when |
|------|--------|------|---------------|
| 1 | Face picker button | "Pick a face to start" | Face picker popover opens |
| 2 | Mixins toggle (GripHorizontal) | "Layer your style with Mixins" | Mixins panel expands |
| 3 | Textarea | "Describe your portrait here" | User types or generates |

On step 3 completion → `localStorage.setItem('kanojo:onboarded', '1')` → component unmounts.
Also dismissed early (localStorage set) on first successful generation.

---

## Architecture

### State

`app/studio/page.tsx` owns `onboardingStep: 0 | 1 | 2 | 3` (0 = complete/seen).

- `0` → coach-marks hidden
- `1` → step 1 active (face picker beacon)
- `2` → step 2 active (mixins beacon)
- `3` → step 3 active (textarea beacon)

Initialized from localStorage: `kanojo:onboarded` set → `0`, else → `1`.

### Bus Event

Add `prompt:prefill: string` to `Events` in `lib/bus.ts`. Producer listens and sets textarea value.

### Producer Callbacks

Two new optional props on `Producer`:
- `onFacePickerOpen?: () => void` — called when face picker popover opens (passed to FacePicker as `onOpen`)
- `onExpandedChange?: (expanded: boolean) => void` — called alongside internal `setExpanded`

### FacePicker Prop

Add optional `onOpen?: () => void` to `FacePickerProps`. Called when the Popover opens (`onOpenChange` fires with `true`).

### Coach-mark Positioning

Each beacon is `position: fixed`, coordinates derived from a `data-coach` attribute on the target elements (face picker button, mixins toggle, textarea). `StudioCoachMarks` uses `querySelector('[data-coach="face"]')` + `getBoundingClientRect()` to position each beacon.

---

## Files

| Action | File |
|--------|------|
| Create | `components/studio-welcome.tsx` |
| Create | `components/studio-coach-marks.tsx` |
| Modify | `app/studio/page.tsx` |
| Modify | `components/producer.tsx` |
| Modify | `components/face-picker.tsx` |
| Modify | `lib/bus.ts` |

---

## Out of Scope

- No DB changes (localStorage is sufficient for coach-mark state)
- No onboarding analytics (can add later)
- No mobile-specific coach-mark layout (desktop-first for now)
