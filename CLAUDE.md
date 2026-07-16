# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Skill Pipeline Override

**For small tasks (≤3 files, clear requirements, no architectural decisions): skip all skill pipelines.**
Do NOT invoke brainstorming, planning, subagent-driven-development, or review skills.
Just do the work directly: read → write → done.

Reserve the full skill pipeline only for: large features, high-risk changes, multi-subsystem work,
or when the user explicitly asks for a formal plan.

## Quick Reference

- **What:** AI portrait photography platform (Kanojo Studio) — MVP, pre-public-launch
- **Dev server:** `sudo pnpm dev` → HTTPS port 443 at `https://kanojostudio.io`
- **CRITICAL:** Three Supabase clients — never mix contexts (see Architecture below)
- **Style:** kebab-case files, arrow functions, no semicolons, single quotes — see `docs/CODING_STYLE.md`
- **Commits:** `feat|fix|refactor|docs: message` + `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
- **Plans:** `docs/plans/{date}-{slug}-design.md` + `{date}-{slug}-plan.md` — use `/new-plan` to scaffold
- **DB:** 9 tables total — `profiles`, `moments`, `photos`, `assets`, `purchases`, `posts`, `likes`, `transactions`, `subscriptions`
- **Open questions:** `docs/OPEN_QUESTIONS.md` — check before touching content policy, look curation, or onboarding

## Project Overview

AI-powered portrait photography platform (Kanojo Studio MVP) built with Next.js 16, Supabase, and Google Gemini API.

## Development Server

The dev server runs **HTTPS on port 443** using local certs:

- Cert files in repo root (gitignored): `kanojostudio.io.pem` + `kanojostudio.io-key.pem`
- Local DNS: add `127.0.0.1 kanojostudio.io` to `/etc/hosts`
- OAuth redirect must be `https://kanojostudio.io/auth/callback`
- Binding port 443 may require `sudo pnpm dev` (EACCES without it on some setups)

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

Full pipeline (API route → engine → analyzers → storage, deep-merge order, delta storage rationale) is documented in the `image-generation-flow` skill — invoke it when working on `/api/photo`, `lib/engine.ts`, or the analyzers.

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

**Pattern:** prefer a single `supabase.rpc('function_name', ...)` call over multiple queries with client-side merging. Database logic stays in `schema.sql`; hooks stay simple and declarative.

### Database Schema

See `supabase/schema.sql` for full table/field definitions and RLS policies (9 tables — don't assume fewer, see Common Mistakes #5).

### Component Architecture

- **Server Components by default** - Use for static content, data fetching
- **Client Components** (`'use client'`) - Only when needed for:
  - TanStack Query hooks
  - Form interactions (React Hook Form)
  - Client-side state (useState, useEffect)
  - Event handlers

### TypeScript Types

All database and domain types are defined in `lib/types.ts` (see `docs/ASSET.md` and `docs/MIXIN.md` for `Asset`/`Mixins` details) — always use these instead of inline definitions.

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=   # New format: sb_publishable_xxx
GEMINI_API_KEY=
NEXT_PUBLIC_APP_URL=                    # For OAuth redirects
```

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

## Coding Style

Full guide: `docs/CODING_STYLE.md` — this is the authoritative reference.

Quick summary:
- **File naming:** kebab-case always (`use-assets.ts`, `face-picker.tsx`)
- **Components:** arrow functions with named exports; pages use default export
- **Formatting:** no semicolons, single quotes, trailing commas
- **Import order:** React/Next → external packages → `@/` internal → relative → `import type` last
- **Props:** inline `type` (not `interface`), destructure in function signature
- **No** barrel files (`index.ts`) — import directly from source

## Common Mistakes ⚠️

1. **Wrong Supabase client** — server client in browser throws; browser client in API route silently misses the session. Match client to context (see Architecture → Supabase Client Pattern).
2. **Missing `'use client'`** — any component importing from `/hooks/` must have `'use client'` at the top. Runtime error often points to wrong file.
3. **`assets.path` is not a URL** — it's a Supabase Storage path. Use `supabase.storage.from('assets').getPublicUrl(path)` before rendering.
4. **Photo fields are deltas** — always merge with moment baseline: `photo.prompt || moment.prompt` and `{ ...moment.mixins, ...photo.mixins }`.
5. **Schema has 9 tables, docs show 5** — `posts`, `likes`, `transactions`, `subscriptions` also exist. Don't design around a missing table.
6. **Port 443 needs `sudo`** — if `pnpm dev` throws EACCES, run `sudo pnpm dev`.
7. **Credits are integers, not cents** — convert Stripe amounts (`stripeAmountInCents / 100`) before writing to `profiles.credits`.

## Plans Workflow

For any non-trivial feature, write docs before code:

1. **Design doc** (`docs/plans/{YYYY-MM-DD}-{slug}-design.md`): problem, solution, key decisions, open questions, rejected alternatives
2. **Implementation plan** (`docs/plans/{YYYY-MM-DD}-{slug}-plan.md`): ordered `- [ ]` checklist with sequencing notes

See `docs/plans/2026-03-14-google-one-tap-design.md` as format reference.

Use `/new-plan <feature-name>` to scaffold the pair automatically.

## Open Questions

`docs/OPEN_QUESTIONS.md` tracks three launch-blocking decisions:
1. **Content policy** — affects what can be generated and shared publicly
2. **Look curation pipeline** — affects asset marketplace design and moderation flow
3. **First-shoot onboarding** — affects studio UX and API design

Check this file before implementing features that touch any of these areas.
