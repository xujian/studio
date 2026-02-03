# Moment Carousel Refactor Design

**Date:** 2026-02-04
**Status:** Approved

## Overview

Refactor the studio page to group photos by moment, displaying each moment as a carousel in the grid. Enhance MomentView modal to support carousel navigation across all photos in a moment.

## Goals

- Group photos by moment in the grid layout
- Add carousel navigation to each moment card
- Enable carousel navigation in the fullscreen MomentView modal
- Maintain existing UX (click to open, drag to dismiss)
- Keep current grid layout and visual style

## User Experience

### Grid Interaction

- Each moment displays as one grid item containing a carousel
- Hover over moment → arrows appear for navigation
- Click any photo → opens MomentView to that specific photo
- Single-photo moments show just the image (no carousel UI)

### MomentView Interaction

- Opens to the clicked photo
- Arrows always visible for navigation
- Dots indicator shows position in moment
- Existing features preserved (drag-to-dismiss, ESC to close, keyboard navigation)

## Component Structure

### New Component: MomentCard

**File:** `/components/moment-card.tsx`

**Purpose:** Encapsulate moment display with carousel logic

**Interface:**
```typescript
interface MomentCardProps {
  moment: MomentWithPhotos
  onPhotoClick: (photo: Photo, moment: MomentWithPhotos) => void
}
```

**Responsibilities:**
- Render carousel for multi-photo moments
- Render single image for single-photo moments
- Show/hide arrows on hover
- Display dots indicator
- Emit click events to parent

**Key features:**
- Wraps in `MagneticCard` for consistency
- Uses `layoutId` for shared element transitions
- Conditional rendering based on photo count
- Hover state management for arrow visibility

### Enhanced Component: MomentView

**File:** `/components/moment-view.tsx`

**Interface changes:**
```typescript
// Before
interface MomentViewProps {
  photo: Photo
  prompt: string
  onClose: () => void
}

// After
interface MomentViewProps {
  moment: MomentWithPhotos
  initialPhotoId: string
  onClose: () => void
}
```

**New features:**
- Carousel navigation with always-visible arrows
- Dots indicator for position tracking
- Opens to specific photo via `initialPhotoId`
- Maintains drag-to-dismiss functionality
- Preserves keyboard navigation (ESC, arrow keys)

### Updated: Studio Page

**File:** `/app/studio/page.tsx`

**State changes:**
```typescript
// Before
const [selectedPhoto, setSelectedPhoto] = useState<{
  photo: Photo
  prompt: string
} | null>(null)

// After
const [selectedMoment, setSelectedMoment] = useState<{
  moment: MomentWithPhotos
  initialPhotoId: string
} | null>(null)
```

**Rendering changes:**
```typescript
// Before: flatten all photos
allMoments.map(moment =>
  moment.photos.map(photo => <PhotoCard />)
)

// After: one card per moment
allMoments.map(moment =>
  <MomentCard moment={moment} onPhotoClick={handleClick} />
)
```

## Data Flow

1. **User hovers over moment card** → Arrows fade in (150-200ms transition)
2. **User clicks photo in carousel** → Studio page captures `(photo, moment)`
3. **Studio page sets state** → `{ moment, initialPhotoId: photo.id }`
4. **MomentView opens** → Scrolls to `initialPhotoId` via Carousel API
5. **User navigates** → Carousel updates, dots indicator reflects position
6. **User closes** → State clears, returns to grid

## Technical Details

### Carousel Configuration

**Grid carousel:**
- Navigation: Arrows (hover-only)
- Indicators: Dots (always visible)
- Loop: Disabled
- Drag: Enabled

**MomentView carousel:**
- Navigation: Arrows (always visible)
- Indicators: Dots (always visible)
- Loop: Disabled
- Drag: Enabled (vertical for dismiss)
- Initial slide: Set via `initialPhotoId`

### Shared Element Transitions

- Use `layoutId={photo.id}` on individual photos
- Ensures smooth animation from grid to MomentView
- Works with Framer Motion's LayoutGroup

### Conditional Rendering

**Single photo moments:**
```typescript
{moment.photos.length === 1 ? (
  <Image /> // No carousel wrapper
) : (
  <Carousel>...</Carousel>
)}
```

**MomentView single photo:**
- Still use Carousel structure for consistency
- Hide arrows/dots via conditional rendering
- Maintains modal behavior (drag, animations)

## Edge Cases

1. **Empty moments:** Defensive check returns null (should never happen)
2. **Navigation limits:** Embla handles automatically (disables arrows at ends)
3. **Keyboard navigation:** ESC closes, arrow keys navigate (Embla provides)
4. **Loading states:** Show skeleton while photos load
5. **Animation performance:** LayoutId on photos, not carousel wrapper

## Accessibility

- Carousel has ARIA labels (provided by Embla)
- Images have alt text from `moment.prompt`
- Keyboard navigation supported (ESC, arrows)
- Focus management in modal
- Disabled arrows visually indicate navigation limits

## Visual Polish

- **Dots:** Small, subtle, bottom-positioned
- **Arrows:** Match UI button style, side-positioned
- **Hover transition:** Smooth fade-in (150-200ms)
- **Arrow visibility:** Hidden by default in grid, always visible in modal

## Files Modified

- ✏️ `/app/studio/page.tsx` - Refactor to use MomentCard
- ✏️ `/components/moment-view.tsx` - Add carousel support
- ✏️ `/components/motion-exports.ts` - Export MomentCard
- ➕ `/components/moment-card.tsx` - New component

## Dependencies

- Existing Carousel components (shadcn/ui)
- Embla Carousel (already installed)
- Framer Motion (already installed)
- No new packages required

## Testing Considerations

- Test single-photo moments (no carousel UI)
- Test multi-photo moments (carousel navigation)
- Test click → MomentView opens to correct photo
- Test hover states (arrows appear/disappear)
- Test keyboard navigation in MomentView
- Test drag-to-dismiss still works
- Test shared element transitions
- Test responsive behavior

## Implementation Order

1. Create MomentCard component
2. Update MomentView component
3. Refactor studio page
4. Update motion-exports
5. Test all interactions
6. Polish animations and styling
