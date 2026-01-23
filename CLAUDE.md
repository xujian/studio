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

### Data Fetching

- **TanStack Query** for all client-side data fetching
- Custom hooks in `/hooks`:
  - `useGenerations()` - Fetch user's generation history
  - `useGenerateMutation()` - Create new generation, auto-invalidates query cache
  - `useDeleteGeneration()` - Delete generation
  - `useUser()` - Fetch current user profile

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
