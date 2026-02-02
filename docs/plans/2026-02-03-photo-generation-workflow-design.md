# Photo Generation Workflow Design

**Date:** 2026-02-03
**Status:** Approved
**Purpose:** Implement basic photo generation workflow in Producer component with face selection and Engine integration

---

## Overview

Transform the Producer component into a self-contained generation interface that:
- Accepts user prompts and face selections
- Calls the Engine service to generate photos with Gemini API
- Manages moment creation and photo retries
- Updates the moments grid automatically

**Core Concept:** The Engine is a first-class abstraction that handles all generation operations, including face retrieval, prompt composition, and API orchestration.

---

## Architecture

### Component State & Props

The Producer component becomes self-contained with its own generation logic.

**New State:**
- `selectedFaceId: string | null` - Tracks which face asset is selected (null = use fallback)
- `currentMomentId: string | null` - Tracks the moment being worked on (null = fresh start)
- `prompt: string` - The textarea input value
- `mode: 'generate' | 'retry'` - Button mode (affects label and behavior)

**New Props:**
```typescript
interface ProducerProps {
  className?: string
  onGenerationComplete?: (moment: Moment) => void  // Optional callback for parent
}
```

**Removed Props:**
- `isLoading` - Now managed internally via the hook
- `defaultValue` - Producer manages its own prompt state
- `onSubmit` - No longer needs parent handler

**Key Behaviors:**
- When face is selected from FacePicker → update `selectedFaceId`
- When generate button clicked → call new hook with `{prompt, mixins: {face}, moment}`
- On success → set `currentMomentId`, change mode to 'retry', call optional callback, invalidate cache
- When "New/Clear" button clicked → reset all state (null moment, mode back to 'generate', clear prompt)

---

### Client-Side Hook (`useEngine`)

Create `/hooks/use-engine.ts` - establishes the Engine as a core domain concept:

```typescript
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Moment } from '@/lib/types'

export const useEngine = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      prompt,
      mixins,
      moment
    }: {
      prompt: string
      mixins?: { face?: string }
      moment?: string | null
    }) => {
      const response = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mixins, moment }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate')
      }

      return response.json() as Promise<Moment>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moments'] })
    },
  })
}
```

**Old Hooks to Remove:**
- Delete `useGenerateMutation` from `/hooks/use-generations.ts`
- Keep `useDeleteGeneration` if still needed
- Rename file to `/hooks/use-engine.ts`

---

### API Endpoint (`/api/engine`)

Create new endpoint `/api/engine/route.ts` - user-facing API for generation.

**Request Body:**
```typescript
{
  prompt: string              // Required - user's text prompt
  mixins?: {                  // Optional - generation modifiers
    face?: string            // Asset ID for face (null = use fallback)
    // Future: hair, clothing, style, etc.
  }
  moment?: string            // Optional - existing moment ID (null = create new)
}
```

**Endpoint Logic:**
1. Validate request body with Zod schema
2. Get authenticated user session
3. If `moment` provided → verify user owns that moment
4. Call Engine service: `await engine.generate({ userId, prompt, mixins })`
5. Upload generated image to Supabase Storage
6. If `moment` exists → insert photo into existing moment
7. If `moment` is null → create new moment + insert photo
8. Return full moment object with all photos

**Response:**
```typescript
{
  id: string              // Moment ID
  user_id: string
  prompt: string
  created_at: string
  photos: Photo[]         // Array including the new photo
}
```

**Error Handling:**
- Invalid moment ID → 404
- Unauthorized access → 403
- Engine failure → 500 with error message
- Validation errors → 400

---

### Engine Service (`/lib/engine.ts`)

Server-side service for generation orchestration - handles face retrieval and Gemini API calls.

**Service Structure:**
```typescript
// /lib/engine.ts
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const FALLBACK_FACE_ID = process.env.FALLBACK_FACE_ID || 'default-face-id'

export const engine = {
  generate: async ({
    userId,
    prompt,
    mixins
  }: {
    userId: string
    prompt: string
    mixins?: { face?: string }
  }) => {
    // 1. Determine which face to use
    const faceId = mixins?.face || FALLBACK_FACE_ID

    // 2. Retrieve face image from Supabase Storage
    const supabase = await createClient()
    const { data: faceAsset, error: assetError } = await supabase
      .from('assets')
      .select('storage_path')
      .eq('id', faceId)
      .single()

    if (assetError || !faceAsset) {
      throw new Error('Face not found')
    }

    // 3. Get signed URL for the face image
    const { data: urlData, error: urlError } = await supabase.storage
      .from('assets')
      .createSignedUrl(faceAsset.storage_path, 60)

    if (urlError || !urlData) {
      throw new Error('Failed to retrieve face image')
    }

    // 4. Fetch image as buffer for Gemini
    const imageResponse = await fetch(urlData.signedUrl)
    const imageBuffer = await imageResponse.arrayBuffer()

    // 5. Call Gemini API with face + prompt
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    const result = await model.generateContent([
      {
        inlineData: {
          data: Buffer.from(imageBuffer).toString('base64'),
          mimeType: 'image/jpeg'
        }
      },
      { text: prompt }
    ])

    // 6. Extract and return generated image data
    return extractGeneratedImage(result)
  }
}

function extractGeneratedImage(result: any) {
  // Implementation depends on Gemini response format
  // Return image data (base64, buffer, or URL)
}
```

**Key Points:**
- Fallback face ID from environment variable
- Uses server Supabase client for secure storage access
- Converts face image to base64 for Gemini API
- Returns generated image data for API endpoint to upload

**Separation of Concerns:**
- `/api/engine` handles HTTP, auth, database operations
- `/lib/engine` handles pure generation logic
- Keeps business logic testable and reusable

---

## Data Flow

Complete flow from user action to UI update:

### 1. User Interaction (Producer Component)
- User selects face from FacePicker → updates `selectedFaceId` state
- User types prompt → updates `prompt` state
- User clicks Generate button → triggers submission

### 2. Client-Side Hook Call
```typescript
const { mutate, isPending } = useEngine()

const handleGenerate = () => {
  mutate({
    prompt: prompt,
    mixins: selectedFaceId ? { face: selectedFaceId } : undefined,
    moment: currentMomentId || undefined
  })
}
```

### 3. API Endpoint (`/api/engine/route.ts`)
- Validates request body (Zod)
- Authenticates user session
- Calls `engine.generate({ userId, prompt, mixins })`
- Waits for generated image data
- Creates new moment (if `moment` is null) OR fetches existing moment
- Uploads generated image to Supabase Storage
- Inserts new photo record with storage URL and mixins
- Returns full moment object with all photos

### 4. Engine Service (`/lib/engine.ts`)
- Retrieves face asset from database
- Gets face image from Supabase Storage
- Calls Gemini API with face image + prompt
- Returns generated image data (base64 or buffer)

### 5. Back to API Endpoint
- Uploads generated image to Supabase Storage (`photos` bucket)
- Saves photo record with storage URL and mixins JSONB
- Returns moment object

### 6. Client-Side Success
- Hook's `onSuccess` invalidates moments cache
- Producer updates state: `currentMomentId = moment.id`, `mode = 'retry'`
- Producer calls `onGenerationComplete?.(moment)` callback
- useMoments hook auto-refetches → grid shows new photo

### Error Flow
- Any failure in Engine/API → hook receives error
- Producer shows error state (toast/alert)
- User can retry

---

## Database Schema

### New Tables

```sql
-- Moments table (groups related photos by prompt)
CREATE TABLE moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_moments_user_created ON moments(user_id, created_at DESC);

-- Photos table (individual generated images)
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id UUID NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mixins JSONB,  -- Stores face, hair, clothing, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_photos_moment ON photos(moment_id, created_at DESC);
CREATE INDEX idx_photos_mixins ON photos USING GIN (mixins);  -- For search

-- RLS Policies
ALTER TABLE moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Users can only view/insert/delete their own moments
CREATE POLICY "Users can view own moments"
  ON moments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own moments"
  ON moments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own moments"
  ON moments FOR DELETE
  USING (auth.uid() = user_id);

-- Users can view photos from their own moments
CREATE POLICY "Users can view own photos"
  ON photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM moments
      WHERE moments.id = photos.moment_id
      AND moments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert photos to own moments"
  ON photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM moments
      WHERE moments.id = photos.moment_id
      AND moments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete photos from own moments"
  ON photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM moments
      WHERE moments.id = photos.moment_id
      AND moments.user_id = auth.uid()
    )
  );
```

### Mixins Storage Strategy

**Why JSONB in photos table:**
- Each photo can have different mixins (allows experimenting within same moment)
- Flexible schema (can add new mixin properties without migrations)
- GIN index enables fast searches: `WHERE mixins @> '{"face": "xyz"}'`
- Supports complex queries: find photos with specific face, or moments containing photos with specific mixins

**Search Examples:**
```sql
-- Find all photos using specific face
SELECT * FROM photos WHERE mixins @> '{"face": "face-id-123"}';

-- Find moments containing photos with specific face
SELECT DISTINCT m.*
FROM moments m
JOIN photos p ON p.moment_id = m.id
WHERE p.mixins @> '{"face": "face-id-123"}';

-- Complex mixin search (future)
WHERE mixins @> '{"face": "x", "hair": "y"}';
```

---

### Storage Setup

**Bucket:** `photos` (or reuse `generations` bucket)

**Storage Path Pattern:** `{userId}/{momentId}/{photoId}.png`

**Storage Policy:**
```sql
-- Allow users to upload photos to their own folders
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own photos
CREATE POLICY "Users can read own photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

### Validation Schema

```typescript
// lib/validations.ts
import { z } from 'zod'

export const engineRequestSchema = z.object({
  prompt: z.string().min(1).max(1000),
  mixins: z.object({
    face: z.string().uuid().optional()
    // Future: hair, clothing, style, etc.
  }).optional(),
  moment: z.string().uuid().optional()
})

export type EngineRequest = z.infer<typeof engineRequestSchema>
```

---

## Producer Component Implementation

### Component Structure

```typescript
// components/producer/index.tsx
'use client'

import * as React from 'react'
import { useState } from 'react'
import { Button, Textarea, Toggle } from '@/components/ui'
import { cn } from '@/lib/utils'
import { Mixins } from './mixins'
import { Loader2, ArrowUp, Plus, GripHorizontal, X } from 'lucide-react'
import { FacePicker } from '../face-picker'
import { useAssets } from '@/hooks/use-assets'
import { useEngine } from '@/hooks/use-engine'
import type { Moment } from '@/lib/types'

interface ProducerProps {
  className?: string
  onGenerationComplete?: (moment: Moment) => void
}

export function Producer({
  className,
  onGenerationComplete
}: ProducerProps) {
  // State
  const [selectedFaceId, setSelectedFaceId] = useState<string | null>(null)
  const [currentMomentId, setCurrentMomentId] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [mode, setMode] = useState<'generate' | 'retry'>('generate')
  const [expanded, setExpanded] = useState(false)

  // Data
  const { data: assets = [] } = useAssets()
  const { mutate, isPending, error } = useEngine()

  // Handlers
  const handleGenerate = () => {
    if (!prompt.trim()) return

    mutate({
      prompt,
      mixins: selectedFaceId ? { face: selectedFaceId } : undefined,
      moment: currentMomentId || undefined
    }, {
      onSuccess: (moment) => {
        setCurrentMomentId(moment.id)
        setMode('retry')
        onGenerationComplete?.(moment)
      }
    })
  }

  const handleNew = () => {
    setCurrentMomentId(null)
    setMode('generate')
    setPrompt('')
    setSelectedFaceId(null)
  }

  const handleFaceSelect = (faceId: string) => {
    setSelectedFaceId(faceId)
  }

  const toggleExpanded = () => {
    setExpanded(!expanded)
  }

  const filterAssets = (type?: string) => {
    if (!type) return assets
    return assets.filter(asset => asset.type === type)
  }

  return (
    <div className={cn(
      'producer fixed bottom-4 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2',
      'glass animate-float-up rounded-4xl bg-accent/80',
      'transition-all duration-300',
      className
    )}>
      {/* Mixins (expanded state) */}
      <div className={cn(
        '-mb-7 flex px-8 opacity-0 transition-all duration-300',
        { 'mb-0 opacity-100': expanded }
      )}>
        <Mixins value={{}} />
      </div>

      {/* Main input area */}
      <div className="-m-px flex flex-col rounded-4xl border border-white/50 bg-black/20 p-4 overflow-hidden">
        <div className="flex-1 rounded">
          <Textarea
            placeholder="Describe the portrait you want to create..."
            className="min-h-25 resize-none border-none bg-transparent! focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{ marginLeft: '48px' }}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isPending}
          />
        </div>

        {/* Bottom controls */}
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="icon-button"
              disabled={isPending}
            >
              <Plus />
            </Button>
            <Toggle
              pressed={expanded}
              type="button"
              variant="outline"
              className="button"
              onClick={toggleExpanded}
            >
              <GripHorizontal />
            </Toggle>
          </div>

          <div className="flex items-center gap-2">
            {/* New/Clear button (only visible in retry mode) */}
            {mode === 'retry' && (
              <Button
                type="button"
                variant="outline"
                className="icon-button"
                onClick={handleNew}
                disabled={isPending}
              >
                <X />
              </Button>
            )}

            {/* Generate/Retry button */}
            <Button
              type="button"
              variant="outline"
              className="icon-button"
              onClick={handleGenerate}
              disabled={isPending || !prompt.trim()}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Face Picker */}
      <div className="absolute h-12 bottom-26 left-3">
        <FacePicker
          faces={filterAssets('face')}
          onSelect={handleFaceSelect}
          selected={selectedFaceId}
        />
      </div>

      {/* Error display (optional toast) */}
      {error && (
        <div className="absolute top-0 left-0 right-0 p-2 bg-destructive text-destructive-foreground text-sm rounded-t-4xl">
          {error.message}
        </div>
      )}
    </div>
  )
}
```

### UI Changes Summary

1. **Generate/Retry Button:**
   - Label/behavior changes based on `mode` state
   - Shows Loader2 icon when `isPending`
   - Disabled when prompt is empty or loading

2. **New/Clear Button:**
   - Only visible when `mode === 'retry'`
   - Shows X icon
   - Resets all state (moment, mode, prompt, face)

3. **Face Selection:**
   - FacePicker receives `onSelect` callback
   - Visual indicator of `selected` face
   - Updates `selectedFaceId` state

4. **Error Display:**
   - Shows error message at top of Producer
   - Could be replaced with toast notification

5. **Loading State:**
   - Textarea disabled when `isPending`
   - Button shows spinner icon

---

## Implementation Notes

### Type Definitions

```typescript
// lib/types.ts

export interface Moment {
  id: string
  user_id: string
  prompt: string
  created_at: string
  photos: Photo[]
}

export interface Photo {
  id: string
  moment_id: string
  url: string
  storage_path: string
  mixins: {
    face?: string
    // Future: hair, clothing, style, etc.
  } | null
  created_at: string
}
```

### Environment Variables

```env
# Existing
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
GEMINI_API_KEY=
NEXT_PUBLIC_APP_URL=

# New
FALLBACK_FACE_ID=  # UUID of default face asset
```

### Migration from Generations to Moments

**If `generations` table exists:**
- Keep it for backward compatibility OR
- Migrate data to new `moments`/`photos` tables
- Update existing queries to use new schema

**Clean migration:**
```sql
-- Insert existing generations as moments
INSERT INTO moments (id, user_id, prompt, created_at)
SELECT id, user_id, prompt, created_at FROM generations;

-- Insert photos from generations
INSERT INTO photos (id, moment_id, url, storage_path, created_at)
SELECT
  gen_random_uuid(),
  id as moment_id,
  url,
  url as storage_path,  -- Adjust if needed
  created_at
FROM generations;
```

---

## Testing Strategy

### Unit Tests

1. **Engine Service (`lib/engine.ts`):**
   - Test fallback face logic
   - Mock Supabase storage calls
   - Mock Gemini API calls
   - Test error handling (missing face, API failures)

2. **Validation (`lib/validations.ts`):**
   - Test schema validation with valid/invalid inputs
   - Test optional fields

### Integration Tests

1. **API Endpoint (`/api/engine`):**
   - Test creating new moment
   - Test adding photo to existing moment
   - Test authentication/authorization
   - Test error responses

2. **Producer Component:**
   - Test state transitions (generate → retry → new)
   - Test face selection
   - Test form submission
   - Test error display

### Manual Testing Checklist

- [ ] Select face, enter prompt, click Generate → photo appears in grid
- [ ] Click Retry → another photo added to same moment
- [ ] Change face, click Retry → new photo with different face in same moment
- [ ] Click New → form resets, mode changes to Generate
- [ ] Generate without selecting face → uses fallback face
- [ ] Empty prompt → button disabled
- [ ] API error → error message displayed
- [ ] Loading state → button shows spinner, form disabled

---

## Future Enhancements

1. **Extended Mixins:**
   - Add hair, clothing, background, style selectors
   - Update Engine to compose complex prompts from mixins

2. **Prompt Templates:**
   - Pre-made prompts for common scenarios
   - Prompt history/favorites

3. **Batch Generation:**
   - Generate multiple variations at once
   - Queue system for multiple requests

4. **Advanced Search:**
   - Search moments by mixins
   - Filter by face, date, prompt keywords

5. **Generation History:**
   - View all attempts for a moment
   - Compare different results side-by-side

---

## Success Criteria

- [ ] User can select a face and enter a prompt to generate a photo
- [ ] Generated photo appears in the moments grid automatically
- [ ] User can retry to add more photos to the same moment
- [ ] User can start a new moment with "New" button
- [ ] Fallback face is used when no face is selected
- [ ] Error states are handled gracefully
- [ ] Database properly stores moments, photos, and mixins
- [ ] Search by mixins works with GIN index

---

## Appendix: Key Design Decisions

**1. Why Engine as a separate service?**
- Separates generation logic from HTTP/database concerns
- Easier to test in isolation
- Can be reused from other API routes or background jobs
- Clearer separation of responsibilities

**2. Why mixins in photos table (not moments)?**
- Each photo in a moment can have different mixins
- Supports experimentation within a single concept/prompt
- Enables photo-level search without complexity

**3. Why JSONB for mixins?**
- Flexible schema for future additions
- Efficient indexing with GIN
- No migrations needed for new mixin properties
- Postgres JSONB queries are powerful and performant

**4. Why explicit "New" button?**
- Gives user control over moment boundaries
- Allows free experimentation (change prompt/face) within a moment
- Clear intent vs. implicit behavior

**5. Why useEngine instead of useGenerateWithFace?**
- Engine is a core domain concept
- Will expand beyond simple generation
- Shorter, more distinctive name
- Matches server-side Engine service

---

**End of Design Document**
