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

1. User submits prompt → `/api/generate` POST endpoint
2. Validate with Zod (`promptSchema` in `lib/validations.ts`)
3. Call `generateImage()` from `lib/gemini.ts` (uses Gemini 2.0 Flash)
4. Insert generation record with `status: 'completed'` or `'failed'`
5. Upload base64 image to Supabase Storage bucket `generations`
6. Update generation record with public URL
7. Return generation object to client

**Note:** The Gemini integration (`lib/gemini.ts`) contains placeholder logic for image extraction - verify API response format when implementing.

### Data Fetching Pattern

**Philosophy:** Keep database logic on the server, not in client code.

**TanStack Query Hooks:** All client-side data fetching uses custom hooks in `/hooks`:
- `useGenerations()` - Fetch user's generation history
- `useGenerateMutation()` - Create new generation, auto-invalidates query cache
- `useDeleteGeneration()` - Delete generation
- `useUser()` - Fetch current user profile
- `useAssets()` - Fetch user's own assets + purchased assets

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

Two main tables with RLS policies:

1. **`profiles`** - User profiles (auto-created via trigger on signup)
   - Fields: `id`, `name`, `avatar`, `created_at`
   - RLS: Users can only view/update own profile

2. **`generations`** - Image generations
   - Fields: `id`, `user`, `prompt`, `url`, `status`, `error`, `created_at`
   - RLS: Users can only view/insert/delete own generations
   - Indexes on `user` and `created_at DESC`

### Component Architecture

- **Server Components by default** - Use for static content, data fetching
- **Client Components** (`'use client'`) - Only when needed for:
  - TanStack Query hooks
  - Form interactions (React Hook Form)
  - Client-side state (useState, useEffect)
  - Event handlers

### TypeScript Types

All database types are defined in `lib/types.ts`:
- `Generation` - Matches generations table schema
- `Profile` - Matches profiles table schema

Always use these types instead of inline definitions.

## File Structure

```
/app
  /api/generate     # Image generation endpoint
  /auth/callback    # OAuth callback handler
  /studio           # Generation interface (protected)
  /gallery          # Generation history (protected)
  /login            # Auth page
/components         # React components (mix of server/client)
/hooks              # TanStack Query hooks (all client-side)
/lib
  /supabase         # Three client implementations
  gemini.ts         # Gemini API wrapper
  types.ts          # TypeScript type definitions
  validations.ts    # Zod schemas
  utils.ts          # Utility functions
/supabase
  schema.sql        # Database schema, RLS policies, triggers
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
3. Create public storage bucket named `generations`
4. Add storage policy allowing users to upload to their own folders

## Key Patterns

- **Validation:** All user input validated with Zod schemas before processing
- **Error Handling:** Failed generations logged to database with `status: 'failed'` and `error` message
- **Storage:** Images stored as `{userId}/{generationId}.png` in Supabase Storage
- **State Management:** TanStack Query for server state, React Hook Form for form state
- **Styling:** Tailwind CSS + Shadcn UI components
