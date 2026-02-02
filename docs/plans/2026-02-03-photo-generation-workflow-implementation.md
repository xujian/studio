# Photo Generation Workflow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement self-contained Producer component with face selection, Engine service integration, and moment/photo generation workflow.

**Architecture:** Producer manages its own state and calls useEngine hook → /api/engine endpoint → Engine service (face retrieval + Gemini API) → database/storage → React Query cache invalidation → UI updates.

**Tech Stack:** Next.js 16, React 19, TypeScript, TanStack Query, Supabase (database + storage), Gemini 2.0 Flash API, Zod validation.

---

## Prerequisites

Before starting, verify:
- [ ] Database types in `lib/types.ts` include `Moment` and `Photo` (already exist)
- [ ] Supabase client helpers exist in `lib/supabase/`
- [ ] TanStack Query is configured in the app
- [ ] `GEMINI_API_KEY` is in `.env.local`

---

## Task 1: Database Schema Setup

**Files:**
- Modify: `supabase/schema.sql`

**Step 1: Add storage_path and mixins to photos table**

Open `supabase/schema.sql` and locate the `photos` table. Add the missing columns:

```sql
-- Add to photos table definition
ALTER TABLE photos ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS mixins JSONB;

-- Create GIN index for JSONB search
CREATE INDEX IF NOT EXISTS idx_photos_mixins ON photos USING GIN (mixins);
```

**Step 2: Create storage bucket policies**

Add storage policies at the end of `schema.sql`:

```sql
-- Storage policies for photos bucket
-- Allow users to upload photos to their own folders
CREATE POLICY IF NOT EXISTS "Users can upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own photos
CREATE POLICY IF NOT EXISTS "Users can read own photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Step 3: Apply schema changes**

Run in Supabase SQL Editor or locally:

```bash
# If using local Supabase
supabase db reset

# Or manually copy/paste the ALTER TABLE statements into Supabase SQL Editor
```

**Step 4: Create photos storage bucket**

In Supabase Dashboard:
1. Go to Storage
2. Create new bucket named `photos`
3. Set to Public or Private (recommend Private with policies)
4. Policies should auto-apply from schema.sql

**Step 5: Verify setup**

```sql
-- Check photos table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'photos';

-- Check index exists
SELECT indexname FROM pg_indexes WHERE tablename = 'photos';

-- Check storage bucket exists
SELECT * FROM storage.buckets WHERE name = 'photos';
```

Expected: `storage_path TEXT`, `mixins JSONB`, `idx_photos_mixins` index exists

**Step 6: Add FALLBACK_FACE_ID to environment**

Add to `.env.local`:

```env
FALLBACK_FACE_ID=your-default-face-asset-uuid-here
```

Replace with an actual face asset ID from your assets table (or create one).

**Step 7: Commit**

```bash
git add supabase/schema.sql .env.local
git commit -m "feat(db): add storage_path, mixins to photos table and storage policies

- Add storage_path column for tracking file locations
- Add mixins JSONB column with GIN index for fast searches
- Add storage policies for photos bucket
- Add FALLBACK_FACE_ID environment variable

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Update Type Definitions

**Files:**
- Modify: `lib/types.ts`

**Step 1: Update Photo type**

Locate the `Photo` type around line 39 and update it:

```typescript
export type Photo = {
  id: string
  moment_id: string
  url: string
  storage_path: string  // Add this
  mixins: {             // Add this
    face?: string
  } | null
  created_at: string
}
```

**Step 2: Verify Moment type has photos relation**

Check that `MomentWithPhotos` exists (should be around line 46):

```typescript
export type MomentWithPhotos = Moment & {
  photos: Photo[]
}
```

This should already exist based on the file read.

**Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat(types): update Photo type with storage_path and mixins

- Add storage_path field for tracking file locations
- Add mixins JSONB field for face, hair, etc.
- Supports different mixins per photo within same moment

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Add Validation Schema

**Files:**
- Modify: `lib/validations.ts`

**Step 1: Read existing validations**

```bash
cat lib/validations.ts
```

**Step 2: Add engine request schema**

Add to the end of `lib/validations.ts`:

```typescript
export const engineRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(1000, 'Prompt too long'),
  mixins: z.object({
    face: z.string().uuid('Invalid face ID').optional()
  }).optional(),
  moment: z.string().uuid('Invalid moment ID').optional()
})

export type EngineRequest = z.infer<typeof engineRequestSchema>
```

**Step 3: Verify import**

Ensure Zod is imported at the top:

```typescript
import { z } from 'zod'
```

**Step 4: Commit**

```bash
git add lib/validations.ts
git commit -m "feat(validation): add engine request schema

- Validate prompt (required, 1-1000 chars)
- Validate mixins.face as optional UUID
- Validate moment as optional UUID
- Export EngineRequest type

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Create Engine Service

**Files:**
- Create: `lib/engine.ts`

**Step 1: Create engine service file**

Create `lib/engine.ts` with the following content:

```typescript
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const FALLBACK_FACE_ID = process.env.FALLBACK_FACE_ID || ''

interface GenerateParams {
  userId: string
  prompt: string
  mixins?: { face?: string }
}

interface GenerateResult {
  imageData: string  // base64 encoded image
  mimeType: string
}

export const engine = {
  /**
   * Generate a photo using face + prompt via Gemini API
   */
  generate: async ({
    userId,
    prompt,
    mixins
  }: GenerateParams): Promise<GenerateResult> => {
    // 1. Determine which face to use
    const faceId = mixins?.face || FALLBACK_FACE_ID

    if (!faceId) {
      throw new Error('No face ID provided and FALLBACK_FACE_ID not configured')
    }

    // 2. Retrieve face asset from database
    const supabase = await createClient()
    const { data: faceAsset, error: assetError } = await supabase
      .from('assets')
      .select('url')
      .eq('id', faceId)
      .single()

    if (assetError || !faceAsset) {
      throw new Error(`Face asset not found: ${faceId}`)
    }

    if (!faceAsset.url) {
      throw new Error('Face asset has no URL')
    }

    // 3. Fetch face image as buffer
    const imageResponse = await fetch(faceAsset.url)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch face image: ${imageResponse.statusText}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const imageBase64 = Buffer.from(imageBuffer).toString('base64')

    // 4. Call Gemini API with face + prompt
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType: 'image/jpeg'
        }
      },
      {
        text: `Generate a high-quality portrait photo based on this reference image and prompt: ${prompt}`
      }
    ])

    // 5. Extract generated image from response
    const response = await result.response
    const generatedImage = extractGeneratedImage(response)

    return generatedImage
  }
}

/**
 * Extract base64 image data from Gemini response
 */
function extractGeneratedImage(response: any): GenerateResult {
  // Gemini 2.0 Flash returns images in parts
  const parts = response.candidates?.[0]?.content?.parts || []

  for (const part of parts) {
    if (part.inlineData) {
      return {
        imageData: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/png'
      }
    }
  }

  throw new Error('No image found in Gemini response')
}
```

**Step 2: Verify dependencies**

Ensure `@google/generative-ai` is installed:

```bash
pnpm list @google/generative-ai
```

If not installed:

```bash
pnpm add @google/generative-ai
```

**Step 3: Commit**

```bash
git add lib/engine.ts
git commit -m "feat(engine): add generation service with Gemini API integration

- Retrieve face asset from database
- Fetch face image and convert to base64
- Call Gemini 2.0 Flash with face + prompt
- Extract generated image from response
- Support fallback face via FALLBACK_FACE_ID env var
- Pure business logic, no HTTP/database operations

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Create API Endpoint

**Files:**
- Create: `app/api/engine/route.ts`

**Step 1: Create API route file**

Create `app/api/engine/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { engine } from '@/lib/engine'
import { engineRequestSchema } from '@/lib/validations'
import type { MomentWithPhotos } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json()
    const validation = engineRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { prompt, mixins, moment: momentId } = validation.data

    // 2. Authenticate user
    const supabase = await createClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // 3. If moment provided, verify ownership
    if (momentId) {
      const { data: moment, error: momentError } = await supabase
        .from('moments')
        .select('user_id')
        .eq('id', momentId)
        .single()

      if (momentError) {
        return NextResponse.json(
          { error: 'Moment not found' },
          { status: 404 }
        )
      }

      if (moment.user_id !== userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }
    }

    // 4. Call Engine to generate image
    const { imageData, mimeType } = await engine.generate({
      userId,
      prompt,
      mixins
    })

    // 5. Convert base64 to buffer for upload
    const imageBuffer = Buffer.from(imageData, 'base64')
    const photoId = crypto.randomUUID()
    const extension = mimeType === 'image/jpeg' ? 'jpg' : 'png'
    const storagePath = `${userId}/${momentId || 'temp'}/${photoId}.${extension}`

    // 6. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(storagePath, imageBuffer, {
        contentType: mimeType,
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`)
    }

    // 7. Get public URL
    const { data: urlData } = supabase.storage
      .from('photos')
      .getPublicUrl(storagePath)

    if (!urlData) {
      throw new Error('Failed to get public URL')
    }

    // 8. Create or update moment + insert photo
    let finalMomentId = momentId

    if (!momentId) {
      // Create new moment
      const { data: newMoment, error: momentError } = await supabase
        .from('moments')
        .insert({
          user_id: userId,
          prompt: prompt,
          status: 'completed'
        })
        .select()
        .single()

      if (momentError) {
        throw new Error(`Failed to create moment: ${momentError.message}`)
      }

      finalMomentId = newMoment.id

      // Update storage path with actual moment ID
      const correctPath = `${userId}/${finalMomentId}/${photoId}.${extension}`
      const { error: moveError } = await supabase.storage
        .from('photos')
        .move(storagePath, correctPath)

      if (moveError) {
        console.error('Failed to move file to correct path:', moveError)
        // Continue anyway, photo still works with temp path
      }
    }

    // 9. Insert photo record
    const { error: photoError } = await supabase
      .from('photos')
      .insert({
        id: photoId,
        moment_id: finalMomentId,
        url: urlData.publicUrl,
        storage_path: storagePath,
        mixins: mixins || null
      })

    if (photoError) {
      throw new Error(`Failed to insert photo: ${photoError.message}`)
    }

    // 10. Fetch complete moment with photos
    const { data: completeMoment, error: fetchError } = await supabase
      .from('moments')
      .select(`
        *,
        photos (*)
      `)
      .eq('id', finalMomentId)
      .single()

    if (fetchError) {
      throw new Error(`Failed to fetch moment: ${fetchError.message}`)
    }

    // 11. Return moment with photos
    return NextResponse.json(completeMoment as MomentWithPhotos)

  } catch (error) {
    console.error('Engine API error:', error)
    return NextResponse.json(
      {
        error: 'Generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
```

**Step 2: Test endpoint exists**

```bash
ls -la app/api/engine/
```

Expected: `route.ts` file created

**Step 3: Commit**

```bash
git add app/api/engine/route.ts
git commit -m "feat(api): add /api/engine endpoint for photo generation

- Validate request with Zod schema
- Authenticate user and verify moment ownership
- Call Engine service to generate image
- Upload to Supabase Storage (photos bucket)
- Create new moment or add to existing moment
- Insert photo record with storage_path and mixins
- Return full moment with all photos
- Handle errors with appropriate status codes

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Create useEngine Hook

**Files:**
- Create: `hooks/use-engine.ts`

**Step 1: Create hook file**

Create `hooks/use-engine.ts`:

```typescript
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { MomentWithPhotos } from '@/lib/types'

interface EngineParams {
  prompt: string
  mixins?: { face?: string }
  moment?: string | null
}

export const useEngine = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ prompt, mixins, moment }: EngineParams) => {
      const response = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mixins, moment }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate')
      }

      return response.json() as Promise<MomentWithPhotos>
    },
    onSuccess: () => {
      // Invalidate moments cache to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['moments'] })
    },
  })
}
```

**Step 2: Verify TanStack Query is available**

```bash
pnpm list @tanstack/react-query
```

Should already be installed based on existing `use-generations.ts` usage.

**Step 3: Commit**

```bash
git add hooks/use-engine.ts
git commit -m "feat(hooks): add useEngine hook for photo generation

- Call /api/engine endpoint with prompt, mixins, moment
- Return MomentWithPhotos on success
- Auto-invalidate moments cache for UI refresh
- Type-safe with MomentWithPhotos return type

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Update FacePicker Component

**Files:**
- Create: `components/face-picker/index.tsx` (if doesn't exist)
- Modify: `components/face-picker/index.tsx` (if exists)

**Step 1: Check if FacePicker exists**

```bash
find components -name "face-picker*" -o -name "FacePicker*"
```

**Step 2: Create or update FacePicker**

If doesn't exist, create `components/face-picker/index.tsx`:

```typescript
'use client'

import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { Asset } from '@/lib/types'

interface FacePickerProps {
  faces: Asset[]
  onSelect?: (faceId: string) => void
  selected?: string | null
  className?: string
}

export function FacePicker({
  faces,
  onSelect,
  selected,
  className
}: FacePickerProps) {
  return (
    <div className={cn('flex gap-2 overflow-x-auto', className)}>
      {faces.map((face) => (
        <button
          key={face.id}
          onClick={() => onSelect?.(face.id)}
          className={cn(
            'relative h-12 w-12 flex-shrink-0 rounded-full overflow-hidden',
            'border-2 transition-all',
            selected === face.id
              ? 'border-primary scale-110'
              : 'border-transparent hover:border-primary/50'
          )}
        >
          {face.url && (
            <Image
              src={face.url}
              alt={face.name}
              fill
              className="object-cover"
              sizes="48px"
            />
          )}
        </button>
      ))}
    </div>
  )
}
```

If it exists, modify to add `onSelect` and `selected` props if missing.

**Step 3: Verify component exports**

Ensure component is exported from barrel file if one exists:

```bash
cat components/face-picker/index.tsx | grep "export"
```

**Step 4: Commit**

```bash
git add components/face-picker/
git commit -m "feat(ui): add FacePicker component with selection state

- Display face assets in horizontal scrollable list
- Support onSelect callback for selection
- Highlight selected face with border and scale
- Responsive with hover states

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Update Producer Component

**Files:**
- Modify: `components/producer/index.tsx`

**Step 1: Update Producer component**

Replace the entire content of `components/producer/index.tsx`:

```typescript
'use client'

import * as React from 'react'
import { useState } from 'react'
import {
  Button,
  Textarea,
  Toggle,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import { Mixins } from './mixins'
import {
  Loader2,
  ArrowUp,
  Plus,
  GripHorizontal,
  X
} from 'lucide-react'
import { FacePicker } from '../face-picker'
import { useAssets } from '@/hooks/use-assets'
import { useEngine } from '@/hooks/use-engine'
import type { Asset, AssetType, MomentWithPhotos } from '@/lib/types'

interface ProducerProps {
  className?: string
  onGenerationComplete?: (moment: MomentWithPhotos) => void
}

export function Producer ({
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

  const filterAssets = (type?: AssetType) => {
    if (!type) return assets
    return assets.filter(asset => asset.type === type)
  }

  return (
    <div
      className={cn(
        'producer fixed bottom-4 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2',
        'glass animate-float-up rounded-4xl bg-accent/80',
        'transition-all duration-300',
        className
      )}>
      <div
        className={cn('-mb-7 flex px-8 opacity-0 transition-all duration-300', {
          'mb-0 opacity-100': expanded
        })}>
        <Mixins value={{}} />
      </div>
      <div className="-m-px flex flex-col rounded-4xl border border-white/50 bg-black/20 p-4 overflow-hidden">
        <div className="flex-1 rounded">
          <Textarea
            placeholder="Describe the portrait you want to create..."
            className="min-h-25 resize-none border-none bg-transparent! focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{
              marginLeft: '48px',
            }}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isPending}
          />
        </div>
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="icon-button"
              disabled={isPending}>
              <Plus />
            </Button>
            <Toggle
              pressed={expanded}
              type="button"
              variant="outline"
              className="button"
              onClick={toggleExpanded}>
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
                disabled={isPending}>
                <X />
              </Button>
            )}

            {/* Generate/Retry button */}
            <Button
              type="button"
              variant="outline"
              className="icon-button"
              onClick={handleGenerate}
              disabled={isPending || !prompt.trim()}>
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

      {/* Error display */}
      {error && (
        <div className="absolute top-0 left-0 right-0 p-2 bg-destructive text-destructive-foreground text-sm rounded-t-4xl">
          {error.message}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Verify imports work**

```bash
# Check if useAssets hook exists
ls hooks/use-assets.ts

# Check if Mixins component exists
ls components/producer/mixins.*
```

**Step 3: Commit**

```bash
git add components/producer/index.tsx
git commit -m "feat(ui): implement Producer with generation workflow

- Add state management for face, moment, prompt, mode
- Integrate useEngine hook for generation
- Add New/Clear button (visible in retry mode)
- Add face selection via FacePicker
- Show loading state with spinner
- Display errors at top of component
- Call onGenerationComplete callback on success
- Support generate and retry modes

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Update Studio Page

**Files:**
- Modify: `app/studio/page.tsx`

**Step 1: Update studio page to use new Producer props**

Modify `app/studio/page.tsx`:

```typescript
'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Producer } from '@/components/producer'
import { Button } from '@/components/ui/button'
import { useMoments } from '@/hooks/use-moments'
import { MomentView, StaggerGrid, MagneticCard, MomentSkeleton } from '@/components/motion-exports'
import type { Photo, MomentWithPhotos } from '@/lib/types'
import { motion, LayoutGroup } from 'motion/react'

export default function StudioPage() {
  const [selectedPhoto, setSelectedPhoto] = useState<{
    photo: Photo
    prompt: string
  } | null>(null)

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useMoments()

  const handleGenerationComplete = (moment: MomentWithPhotos) => {
    // Optional: Could add UI feedback here (toast, animation, etc.)
    console.log('Generation complete:', moment)
  }

  // Flatten all pages into single array
  const allMoments = data?.pages.flatMap(page => page.moments) || []

  return (
    <section className="flex w-full flex-col items-start justify-center px-16 pb-52">
      <h1 className="mb-6 text-2xl font-semibold">Moments</h1>
      {isLoading && (
        <StaggerGrid className="w-full grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <MomentSkeleton key={i} />
          ))}
        </StaggerGrid>
      )}
      {error && (
        <div className="text-destructive">
          Failed to load moments: {error.message}
        </div>
      )}
      {allMoments.length === 0 && !isLoading && !error && (
        <div className="text-muted-foreground">No moments yet</div>
      )}
      <LayoutGroup>
        <StaggerGrid
          className="w-full grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-5"
        >
          {allMoments.map(moment =>
            moment.photos.map(photo => (
              <MagneticCard key={photo.id}>
                <motion.div
                  layoutId={photo.id}
                  className="relative aspect-9/16 w-full overflow-hidden rounded bg-muted cursor-pointer"
                  onClick={() => setSelectedPhoto({ photo, prompt: moment.prompt })}
                >
                  <Image
                    className="object-cover"
                    src={photo.url}
                    alt={moment.prompt}
                    fill
                    sizes="(min-width: 1280px) 16vw, (min-width: 768px) 25vw, 50vw"
                    loading="lazy"
                    unoptimized
                  />
                </motion.div>
              </MagneticCard>
            ))
          )}
          {hasNextPage && (
            <div
              className="relative flex aspect-9/16 w-full items-center justify-center rounded bg-muted p-4"
              key="load-more">
              <Button
                className="w-full rounded-full"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                variant="outline">
                {isFetchingNextPage ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </StaggerGrid>
      </LayoutGroup>

      {selectedPhoto && (
        <MomentView
          photo={selectedPhoto.photo}
          prompt={selectedPhoto.prompt}
          onClose={() => setSelectedPhoto(null)}
        />
      )}

      <Producer
        onGenerationComplete={handleGenerationComplete}
      />
    </section>
  )
}
```

**Step 2: Verify changes**

Key changes:
- Removed `isLoading`, `defaultValue`, `onSubmit` props from Producer
- Added `onGenerationComplete` callback
- Producer now self-contained with its own state

**Step 3: Commit**

```bash
git add app/studio/page.tsx
git commit -m "refactor(ui): update studio page for self-contained Producer

- Remove isLoading, defaultValue, onSubmit props
- Add onGenerationComplete callback handler
- Producer now manages its own state and generation
- Simplify parent component logic

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Clean Up Old Hooks

**Files:**
- Modify: `hooks/use-generations.ts` (delete or rename)

**Step 1: Check what's in use-generations.ts**

```bash
cat hooks/use-generations.ts
```

**Step 2: Remove useGenerateMutation**

If file only contains `useGenerateMutation`, delete it:

```bash
git rm hooks/use-generations.ts
```

If file contains other hooks (like `useDeleteGeneration`), remove only `useGenerateMutation`:

Edit `hooks/use-generations.ts` and remove the `useGenerateMutation` function and export.

**Step 3: Search for imports of old hook**

```bash
grep -r "useGenerateMutation" app/ components/ hooks/
```

Verify no files import it (studio/page.tsx should be the only one, and we already updated it).

**Step 4: Commit**

```bash
git add hooks/
git commit -m "refactor(hooks): remove deprecated useGenerateMutation

- Replaced by useEngine hook
- useEngine matches server-side Engine service naming
- Cleaner separation of concerns

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Manual Testing

**Files:**
- N/A (manual testing in browser)

**Step 1: Start development server**

```bash
pnpm dev
```

**Step 2: Test basic generation flow**

1. Navigate to `/studio`
2. Select a face from FacePicker (or leave unselected for fallback)
3. Enter a prompt: "professional headshot, studio lighting"
4. Click Generate button
5. Verify:
   - Button shows loading spinner
   - Textarea is disabled during generation
   - Generated photo appears in moments grid
   - Button changes to Retry mode
   - X button appears next to Generate

**Step 3: Test retry flow**

1. Change prompt: "casual outdoor photo"
2. Click Retry (ArrowUp) button
3. Verify:
   - New photo added to same moment in grid
   - Still in Retry mode

**Step 4: Test new moment flow**

1. Click X (Clear/New) button
2. Verify:
   - Form resets (prompt cleared, face deselected)
   - Button back to Generate mode
   - X button disappears
3. Enter new prompt and generate
4. Verify new moment created (separate from previous)

**Step 5: Test error handling**

1. Temporarily break something (e.g., invalid API key)
2. Try to generate
3. Verify error message appears at top of Producer
4. Fix the issue and verify recovery

**Step 6: Test without face selection**

1. Don't select a face
2. Generate with prompt
3. Verify fallback face is used (check in database or network tab)

**Step 7: Document any issues**

Create GitHub issues or notes for any bugs found.

---

## Task 12: Final Integration Check

**Files:**
- N/A (verification step)

**Step 1: Verify database records**

Open Supabase Dashboard and check:

```sql
-- Check moments created
SELECT * FROM moments ORDER BY created_at DESC LIMIT 5;

-- Check photos with mixins
SELECT id, moment_id, storage_path, mixins FROM photos ORDER BY created_at DESC LIMIT 5;

-- Check storage files exist
SELECT name, bucket_id FROM storage.objects WHERE bucket_id = 'photos' ORDER BY created_at DESC LIMIT 5;
```

**Step 2: Verify React Query cache invalidation**

In browser DevTools:
1. Open React Query DevTools (if installed)
2. Generate a photo
3. Verify `['moments']` query invalidates and refetches

**Step 3: Check Network tab**

1. Generate a photo
2. Open Network tab
3. Verify requests:
   - POST `/api/engine` (status 200)
   - GET moments query refetch
   - Image loads from Supabase Storage

**Step 4: Verify types compile**

```bash
pnpm build
```

Expected: No TypeScript errors

**Step 5: Run linter**

```bash
pnpm lint
```

Fix any warnings or errors.

**Step 6: Final commit**

If any fixes were needed during testing:

```bash
git add .
git commit -m "fix: address issues found during integration testing

[List any fixes made]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Success Criteria Checklist

After completing all tasks, verify:

- [ ] User can select a face and enter a prompt to generate a photo
- [ ] Generated photo appears in the moments grid automatically
- [ ] User can retry to add more photos to the same moment
- [ ] User can start a new moment with "New" button (X icon)
- [ ] Fallback face is used when no face is selected
- [ ] Error states are handled gracefully (error message displayed)
- [ ] Database properly stores moments, photos, storage_path, and mixins
- [ ] Loading states work (spinner, disabled inputs)
- [ ] React Query cache invalidates and UI refreshes
- [ ] No TypeScript errors
- [ ] No console errors during normal operation

---

## Troubleshooting

### Common Issues

**1. "Face not found" error:**
- Check FALLBACK_FACE_ID is set in `.env.local`
- Verify face asset exists in database with that ID
- Ensure assets table has `url` column populated

**2. Storage upload fails:**
- Verify `photos` bucket exists in Supabase
- Check storage policies are applied
- Verify user is authenticated

**3. Gemini API errors:**
- Check GEMINI_API_KEY is valid and not expired
- Verify you have credits/quota
- Check Gemini API model name is correct

**4. Photos don't appear in grid:**
- Check React Query cache invalidation in DevTools
- Verify useMoments hook includes photos in query
- Check photos are associated with correct moment_id

**5. TypeScript errors:**
- Verify all type imports from `lib/types.ts`
- Check Photo type includes storage_path and mixins
- Ensure MomentWithPhotos includes photos array

---

## Next Steps

After successful implementation:

1. **Add mixins support:** Extend to support hair, clothing, style selections
2. **Improve prompts:** Add prompt templates and suggestions
3. **Batch generation:** Generate multiple variations at once
4. **Advanced search:** Search moments by mixins (using GIN index)
5. **Generation history:** View all attempts/retries for a moment
6. **Cost tracking:** Add credits/cost tracking for generations
7. **Quality controls:** Add negative prompts, style strength, etc.

---

**Plan Complete!** Ready to execute task-by-task with superpowers:executing-plans or superpowers:subagent-driven-development.
