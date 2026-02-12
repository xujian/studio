# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered portrait photography platform (Kanojo Studio MVP) built with Next.js 16, Supabase, and Google Gemini API.

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

## Architecture

### Supabase Client Pattern

The project uses **three separate Supabase client instances** depending on context:

- **`lib/supabase/client.ts`** - Browser client for Client Components (uses `createBrowserClient`)
- **`lib/supabase/server.ts`** - Server client for Server Components/API Routes (uses `createServerClient` with async cookies)
- **`lib/supabase/middleware.ts`** - Middleware client for session management in `proxy.ts` (handles cookie updates)

**Critical:** Always import the correct client for your context:
- Client Components → `import { createClient } from '@/lib/supabase/client'`
- Server Components/API Routes → `import { createClient } from '@/lib/supabase/server'`
- Middleware → `import { updateSession } from '@/lib/supabase/middleware'`

All clients use the **publishable key** (format: `sb_publishable_xxx`) which respects Row Level Security policies. The service role key is NOT used in this codebase as all operations work through authenticated user sessions with RLS enforcement.

### Authentication & Route Protection

- Authentication is handled via `proxy.ts` (imported in Next.js middleware pattern)
- Protected routes: `/studio`, `/gallery`
- Auth flow: Google OAuth → `/auth/callback` → Supabase session → auto-create profile via database trigger
- Logged-in users are redirected away from `/login` to `/studio`

### Image Generation Flow

**API Route** (`/api/photo` POST):
1. Validate request with Zod (`engineRequestSchema`)
2. Authenticate user via Supabase session
3. Create or load moment record (baseline prompt + mixins)
4. Load asset data from database based on mixins
5. Call `engine.generate({ userId, prompt, assets, reference })`
6. Upload base64 image to Supabase Storage (`{userId}/{momentId}/{photoId}.{ext}`)
7. Insert photo record with deltas (only differences from moment baseline)
8. Return complete moment with all photos

**Engine** (`lib/engine.ts`) — pure generation function, no auth:
1. **Analyze inputs** → structured JSON baseline
   - Reference image → `ImageAnalyzer` (full scene description)
   - Text prompt → `PromptAnalyzer` (only explicit mentions)
   - Deep merge: prompt overrides reference
2. **Build assets** → face image parts + text sections
   - Face defaults to system face (`defaultAssets.face`) when not provided
   - `AssetsBuilder` produces image parts (face) and text sections (other assets)
   - Asset sections override corresponding JSON keys
3. **Assemble prompt** → face image parts + single combined JSON
4. **Generate** → Gemini API (9:16 portrait, 2K resolution)

**Key Services:**
- **ImageAnalyzer** (`lib/image-analyzer.ts`) - Analyzes reference images using Gemini Vision, extracts detailed structured data, caches results for 30 minutes
- **PromptAnalyzer** (`lib/prompt-analyzer.ts`) - Converts natural language prompts to structured JSON format matching ImageAnalyzer output, enables prompt merging
- **Engine** (`lib/engine.ts`) - Pure generation function: takes userId, prompt, assets, reference; returns base64 image. No auth or database access.

### Data Fetching Pattern

**Philosophy:** Keep database logic on the server, not in client code.

**TanStack Query Hooks:** All client-side data fetching uses custom hooks in `/hooks`:
- `useEngine()` - Image generation mutation (creates moments/photos), auto-invalidates query cache
- `useMoments()` - Fetch user's moment history with photos
- `useAssets()` - Fetch user's own assets + purchased assets (via RPC)
- `useUser()` - Fetch current user profile

**When to Use Postgres Functions:**

For **complex queries** involving:
- Multiple table JOINs
- Subqueries or CTEs
- Business logic that spans multiple tables
- Data aggregation or transformations

Create a Postgres function and call via RPC instead of writing complex client-side queries.

**Pattern Example (useAssets):**

```typescript
// ❌ BAD: Multiple queries + business logic in client
const { data: ownAssets } = await supabase.from('assets').select('*').eq('user_id', userId)
const { data: purchases } = await supabase.from('purchases').select('asset_id').eq('buyer_id', userId)
// ... then merge and deduplicate in client code

// ✅ GOOD: Single RPC call to server-side function
const { data } = await supabase.rpc('get_user_assets', { user_uuid: userId })
```

**Hook Structure:**

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Asset } from '@/lib/types'

export const useAssets = () => {
  const supabase = createClient()

  return useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return []

      const { data, error } = await supabase.rpc('get_user_assets', {
        user_uuid: session.user.id
      })

      if (error) throw error
      return (data || []) as Asset[]
    },
    staleTime: 5 * 60 * 1000 // Cache duration
  })
}
```

**Corresponding Postgres Function:**

```sql
CREATE OR REPLACE FUNCTION get_user_assets(user_uuid uuid)
RETURNS SETOF assets
LANGUAGE SQL STABLE SECURITY DEFINER
AS $$
  SELECT DISTINCT a.*
  FROM assets a
  LEFT JOIN purchases p ON p.asset_id = a.id AND p.buyer_id = user_uuid
  WHERE a.user_id = user_uuid OR p.id IS NOT NULL
  ORDER BY a.created_at DESC;
$$;
```

**Benefits:**
- Single database round trip
- Database logic stays in schema.sql (version controlled, reviewable)
- Client code stays simple and declarative
- Easier to optimize queries (indexes, query plans)
- Better security (SECURITY DEFINER ensures proper RLS)

### Database Schema

Core tables with RLS policies:

1. **`profiles`** - User profiles (auto-created via trigger on signup)
   - Fields: `id`, `name`, `avatar`, `credits`, `created_at`
   - RLS: Users can only view/update own profile

2. **`moments`** - Generation sessions (baseline prompt + mixins)
   - Fields: `id`, `user_id`, `prompt`, `mixins` (JSONB), `final_prompt`, `status`, `created_at`
   - RLS: Users can only view/insert/delete own moments
   - A moment represents a creation session with baseline settings

3. **`photos`** - Generated images (delta storage)
   - Fields: `id`, `moment_id`, `url`, `storage_path`, `prompt` (delta), `mixins` (delta), `created_at`
   - RLS: Users can only view/insert/delete photos for their moments
   - Only stores **differences** from moment baseline (efficient storage)
   - Display logic: `photo.prompt || moment.prompt` and `{ ...moment.mixins, ...photo.mixins }`

4. **`assets`** - Reusable prompt components (faces, styles, scenes, etc.)
   - Fields: `id`, `user_id`, `name`, `type`, `url`, `content`, `is_public`, `price`, `created_at`
   - Types: face, makeup, hair, outfit, scene, lighting, camera
   - Supports both image-based (URL) and text-based (content) assets
   - Marketplace functionality with credits system

5. **`purchases`** - Asset marketplace transactions
   - Tracks which assets users have purchased
   - Used by `get_user_assets()` RPC to return owned + purchased assets

### Component Architecture

- **Server Components by default** - Use for static content, data fetching
- **Client Components** (`'use client'`) - Only when needed for:
  - TanStack Query hooks
  - Form interactions (React Hook Form)
  - Client-side state (useState, useEffect)
  - Event handlers

### TypeScript Types

All database and domain types are defined in `lib/types.ts`:
- `Profile` - User profile schema
- `Moment` - Generation session schema
- `Photo` - Generated image schema
- `MomentWithPhotos` - Moment with related photos array
- `Asset` - Reusable prompt component schema
- `AssetType` - Union type for asset categories
- `Mixins` - Map of asset type to asset ID
- `JsonPrompt` - Structured prompt format (output from ImageAnalyzer/PromptAnalyzer)
  - Contains: subject, outfit, pose, scene, makeup, lighting, camera sections
  - Used for merging reference image analysis with text prompt analysis

**JsonPrompt Structure:**
```typescript
{
  subject: { bodyType, skinTone, expression, bodyLanguage },
  outfit: { top, bottom, footwear?, accessories?, overall },
  pose: { position, limbs, angle, energy },
  scene: { setting, background, foreground, atmosphere },
  makeup: { face, eyes, lips, overall },
  lighting: { direction, quality, shadows, highlights, mood },
  camera: { lens, aperture, angle, framing, focus, style }
}
```

Always use these types instead of inline definitions.

## File Structure

```
/app
  /api/photo        # Image generation endpoint (POST)
  /auth/callback    # OAuth callback handler
  /studio           # Generation interface (protected)
  /gallery          # Generation history (protected)
  /login            # Auth page
/components         # React components (mix of server/client)
  /producer         # Main generation UI component
  /face-picker      # Face asset selector
/hooks              # TanStack Query hooks (all client-side)
  use-engine.ts     # Generation mutation hook
  use-assets.ts     # Asset fetching hook
/lib
  /supabase         # Three client implementations
  engine.ts         # Image generation engine (pure function, no auth)
  image-analyzer.ts # Reference image analyzer service (cached)
  prompt-analyzer.ts # Text prompt structuring service (cached)
  prompts.ts        # Prompt constants and templates
  types.ts          # TypeScript type definitions
  validations.ts    # Zod schemas
  constants.ts      # Asset types and configuration
  utils.ts          # Utility functions
/supabase
  schema.sql        # Database schema, RLS policies, triggers, functions
```

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=   # New format: sb_publishable_xxx
GEMINI_API_KEY=
NEXT_PUBLIC_APP_URL=                    # For OAuth redirects
```

**Note:** Supabase has transitioned to publishable keys (`sb_publishable_xxx`) which replace the older anon keys. If you have an older project, you can find your publishable key in the Supabase Dashboard under Settings → API → API Keys. During the transition period, both key types work, but new projects should use publishable keys.

## Supabase Setup Requirements

1. Run `supabase/schema.sql` in SQL Editor
2. Enable Google OAuth in Authentication → Providers
3. Create public storage bucket named `photos`
4. Add storage policy allowing users to upload to their own folders: `{userId}/{momentId}/*.{jpg|png}`

## Key Patterns

- **Validation:** All user input validated with Zod schemas before processing (`engineRequestSchema`)
- **Error Handling:** Failed generations propagate errors to the API route; analyzer failures are not swallowed
- **Storage:** Images stored as `{userId}/{momentId}/{photoId}.{jpg|png}` in Supabase Storage bucket `photos`
- **Delta Storage:** Photos only store differences from moment baseline (prompt/mixins deltas)
  - Saves storage and makes variation tracking explicit
  - Display: merge moment baseline with photo deltas
- **AI Services with Caching:**
  - `ImageAnalyzer` - 30-minute in-memory cache for reference image analysis
  - `PromptAnalyzer` - 30-minute in-memory cache for prompt structuring
  - Both return `JsonPrompt` structure for easy merging
- **Analysis Merging:** When both reference + prompt provided, prompt analysis overrides reference (deep merge)
- **State Management:** TanStack Query for server state, React Hook Form for form state
- **Styling:** Tailwind CSS + Shadcn UI components
