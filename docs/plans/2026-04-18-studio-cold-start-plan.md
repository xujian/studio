# Studio Cold Start Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a welcome board and coach-mark sequence to eliminate the blank studio page for new users.

**Architecture:** `onboardingStep` state lives in `app/studio/page.tsx` and flows down to `Producer` (via callbacks) and `StudioCoachMarks` (via props). A new `prompt:prefill` bus event wires prompt chips to the Producer textarea. Coach-mark beacons use `data-coach` attributes + `getBoundingClientRect` for fixed positioning.

**Tech Stack:** React, Tailwind CSS, `lib/bus.ts` (mitt), localStorage

---

### Task 1: Add `prompt:prefill` bus event

**Files:**
- Modify: `lib/bus.ts`

**Step 1: Add the event type**

In `lib/bus.ts`, add `'prompt:prefill': string` to the `Events` type:

```ts
type Events = {
  'generation:complete': MomentWithPhotos
  'generation:error': Error
  'moment:resume': MomentResumePayload
  'mixin:select': MixinSelectPayload
  'assets:open': { type: AssetType }
  'assets:close': void
  'prompt:prefill': string
}
```

**Step 2: Commit**

```bash
git add lib/bus.ts
git commit -m "feat: add prompt:prefill bus event"
```

---

### Task 2: Add `onOpen` prop to FacePicker

**Files:**
- Modify: `components/face-picker.tsx`

**Step 1: Add prop to type**

```ts
export type FacePickerProps = {
  faces: Asset[]
  selected?: string
  onSelect?: (faceId: string) => void
  onOpen?: () => void
}
```

**Step 2: Wire to Popover onOpenChange**

In `FacePicker`, the existing `<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>` becomes:

```tsx
<Popover
  open={popoverOpen}
  onOpenChange={(open) => {
    setPopoverOpen(open)
    if (open) onOpen?.()
  }}>
```

**Step 3: Commit**

```bash
git add components/face-picker.tsx
git commit -m "feat: add onOpen callback to FacePicker"
```

---

### Task 3: Add coaching callbacks and bus listener to Producer

**Files:**
- Modify: `components/producer.tsx`

**Step 1: Add new props to ProducerProps**

```ts
interface ProducerProps {
  className?: string
  onGenerationComplete?: (moment: MomentWithPhotos) => void
  onFacePickerOpen?: () => void
  onExpandedChange?: (expanded: boolean) => void
}
```

**Step 2: Destructure new props**

```ts
export function Producer({ className, onGenerationComplete, onFacePickerOpen, onExpandedChange }: ProducerProps) {
```

**Step 3: Add `prompt:prefill` bus listener** (alongside existing `$bus.on` calls)

```ts
$bus.on('prompt:prefill', (text) => {
  setPrompt(text)
  textareaRef.current?.focus()
})
```

**Step 4: Wire `onExpandedChange` into `toggleExpanded`**

```ts
const toggleExpanded = () => {
  const next = !expanded
  setExpanded(next)
  onExpandedChange?.(next)
}
```

**Step 5: Add `data-coach="mixins"` to the mixins Toggle**

Find the `<Toggle>` with `GripHorizontal` and add the attribute:

```tsx
<Toggle
  data-coach="mixins"
  pressed={expanded}
  ...
```

**Step 6: Add `data-coach="textarea"` to the Textarea**

```tsx
<Textarea
  data-coach="textarea"
  ref={textareaRef}
  ...
```

**Step 7: Pass `onFacePickerOpen` and `data-coach` to FacePicker**

```tsx
<FacePicker
  faces={filterAssets('face')}
  onSelect={handleFaceSelect}
  selected={mixins.face as string | undefined}
  onOpen={onFacePickerOpen}
/>
```

Also add `data-coach="face"` to the FacePicker trigger button in `components/face-picker.tsx`:

```tsx
<Button
  data-coach="face"
  variant={selected ? 'ghost' : 'outline'}
  ...
```

**Step 8: Commit**

```bash
git add components/producer.tsx components/face-picker.tsx
git commit -m "feat: add onboarding callbacks and data-coach attributes to Producer"
```

---

### Task 4: Create `<StudioWelcome />`

**Files:**
- Create: `components/studio-welcome.tsx`
- Add: `/public/examples/portrait.jpg` — **you must add this file manually before testing**

**Step 1: Create the component**

```tsx
'use client'

import Image from 'next/image'
import { useBus } from '@/lib/bus'

const PROMPT_CHIPS = [
  'Cinematic street portrait, golden hour',
  'Studio headshot, clean white background',
  'Dreamy outdoor portrait, soft bokeh',
]

export function StudioWelcome() {
  const $bus = useBus()

  const handleChip = (prompt: string) => {
    $bus.emit('prompt:prefill', prompt)
  }

  return (
    <div className="flex flex-col items-center gap-8 py-16 w-full">
      <div className="relative w-48 aspect-9/16 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
        <Image
          src="/examples/portrait.jpg"
          alt="Example portrait"
          fill
          className="object-cover"
          sizes="192px"
          priority
        />
      </div>
      <div className="text-center flex flex-col gap-2">
        <h2 className="text-2xl">Your studio starts here</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Pick a face, describe the mood, generate your first portrait.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {PROMPT_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => handleChip(chip)}
            className="rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
            {chip}
          </button>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/studio-welcome.tsx
git commit -m "feat: add StudioWelcome empty state component"
```

---

### Task 5: Create `<StudioCoachMarks />`

**Files:**
- Create: `components/studio-coach-marks.tsx`

**Step 1: Create the component**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const STEPS: { coach: string; text: string }[] = [
  { coach: 'face',    text: 'Pick a face to start' },
  { coach: 'mixins',  text: 'Layer your style with Mixins' },
  { coach: 'textarea', text: 'Describe your portrait here' },
]

type Props = {
  step: 1 | 2 | 3 | 0
}

type Rect = { top: number; left: number; width: number; height: number }

export function StudioCoachMarks({ step }: Props) {
  const [rect, setRect] = useState<Rect | null>(null)

  useEffect(() => {
    if (step === 0) return
    const s = STEPS[step - 1]
    const el = document.querySelector(`[data-coach="${s.coach}"]`)
    if (!el) return
    const r = el.getBoundingClientRect()
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
  }, [step])

  if (step === 0 || !rect) return null

  const { text } = STEPS[step - 1]
  const beaconCx = rect.left + rect.width / 2
  const beaconCy = rect.top + rect.height / 2

  return (
    <div className="pointer-events-none fixed inset-0 z-[200]">
      {/* Pulse beacon */}
      <span
        className="absolute flex h-4 w-4 -translate-x-1/2 -translate-y-1/2"
        style={{ left: beaconCx, top: beaconCy }}>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
        <span className="relative inline-flex h-4 w-4 rounded-full bg-primary" />
      </span>
      {/* Tooltip */}
      <div
        className={cn(
          'absolute -translate-x-1/2 whitespace-nowrap',
          'rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground shadow-lg',
        )}
        style={{ left: beaconCx, top: beaconCy - 36 }}>
        {text}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/studio-coach-marks.tsx
git commit -m "feat: add StudioCoachMarks component"
```

---

### Task 6: Wire everything into `app/studio/page.tsx`

**Files:**
- Modify: `app/studio/page.tsx`

**Step 1: Add imports**

```tsx
import { StudioWelcome } from '@/components/studio-welcome'
import { StudioCoachMarks } from '@/components/studio-coach-marks'
```

**Step 2: Initialize `onboardingStep` from localStorage**

```tsx
const [onboardingStep, setOnboardingStep] = useState<0 | 1 | 2 | 3>(() => {
  if (typeof window === 'undefined') return 0
  return localStorage.getItem('kanojo:onboarded') ? 0 : 1
})
```

**Step 3: Add handlers**

```tsx
const handleFacePickerOpen = () => {
  if (onboardingStep === 1) setOnboardingStep(2)
}

const handleExpandedChange = (expanded: boolean) => {
  if (onboardingStep === 2 && expanded) setOnboardingStep(3)
}

const handleGenerationComplete = (moment: MomentWithPhotos) => {
  localStorage.setItem('kanojo:onboarded', '1')
  setOnboardingStep(0)
}
```

**Step 4: Replace minimal empty state with `<StudioWelcome />`**

Remove:
```tsx
{allMoments.length === 0 && !isLoading && !error && (
  <div className="flex flex-col items-center gap-3 py-20 text-center w-full">
    <p className="text-muted-foreground">There is all your moments</p>
    <p className="text-sm text-muted-foreground/70">Use the prompt bar below to create your first portrait</p>
  </div>
)}
```

Add:
```tsx
{allMoments.length === 0 && !isLoading && !error && <StudioWelcome />}
```

**Step 5: Pass callbacks to Producer and add `onGenerationComplete`**

```tsx
<Producer
  onFacePickerOpen={handleFacePickerOpen}
  onExpandedChange={handleExpandedChange}
  onGenerationComplete={handleGenerationComplete}
/>
```

**Step 6: Mount `<StudioCoachMarks />` outside the section**

Add just before the closing `</>`:

```tsx
<StudioCoachMarks step={onboardingStep} />
```

**Step 7: Advance step 3 → done when user types**

In the `handlePromptChange` handler inside Producer, add the coach-mark advance. Since Producer doesn't know about onboarding step directly, use a new optional prop `onPromptChange?: () => void`:

Add to `ProducerProps`:
```ts
onPromptChange?: () => void
```

In `handlePromptChange` inside Producer:
```ts
const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  setPrompt(e.target.value)
  if (mode === 'retry') setDirty(true)
  onPromptChange?.()
}
```

In `page.tsx`, add handler and pass prop:
```tsx
const handlePromptChange = () => {
  if (onboardingStep === 3) {
    localStorage.setItem('kanojo:onboarded', '1')
    setOnboardingStep(0)
  }
}
```

```tsx
<Producer
  onFacePickerOpen={handleFacePickerOpen}
  onExpandedChange={handleExpandedChange}
  onGenerationComplete={handleGenerationComplete}
  onPromptChange={handlePromptChange}
/>
```

**Step 8: Commit**

```bash
git add app/studio/page.tsx components/producer.tsx
git commit -m "feat: wire cold-start welcome board and coach-marks into studio page"
```

---

### Task 7: Add example portrait image

**Step 1:** Drop a portrait image at `/public/examples/portrait.jpg`.

It should be 9:16 aspect ratio, high quality, around 400×711px minimum. This is a manual step — pick a compelling output from your existing generated photos.

**Step 2: Commit**

```bash
git add public/examples/portrait.jpg
git commit -m "feat: add example portrait for studio welcome board"
```

---

### Task 8: Manual verification

Visit `https://kanojostudio.io/studio` in a fresh incognito window (clears localStorage):

- [ ] Welcome board shows with one portrait, headline, subline, three chips
- [ ] Beacon pulses on face picker button (step 1)
- [ ] Click face picker → beacon moves to mixins toggle (step 2)
- [ ] Expand mixins → beacon moves to textarea (step 3)
- [ ] Type in textarea → beacon disappears, localStorage `kanojo:onboarded = 1` set
- [ ] Reload page → no coach-marks shown
- [ ] Click a prompt chip → textarea pre-fills with that text
- [ ] Generate a portrait → welcome board disappears, moment grid shows

Clear localStorage and verify coach-marks reappear correctly.
