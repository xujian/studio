# Kanojo Studio MVP - Technical Design

**Date:** 2026-01-22
**Status:** Approved
**Version:** 1.0

## Overview

Kanojo Studio MVP is an AI-powered portrait photography platform. This MVP focuses on core text-to-image generation with Google Gemini, user authentication, and basic generation history.

### MVP Scope

**Included:**
- Text prompt → AI image generation (Google Gemini)
- Google OAuth authentication
- Studio interface (generation UI)
- Gallery interface (view past generations)
- Basic generation metadata (prompt, timestamp, delete/regenerate)
- Synchronous generation flow

**Explicitly Excluded (Future Phases):**
- Face Swap / Image-to-Image
- The Mixer (rule-based prompt builder)
- Templates and favorites
- Prompt enhancement
- Credits/billing system
- Dashboard landing page

---

## Architecture

### Application Structure

**Framework:** Next.js 16 (App Router)

**Routes:**
- `/` → Redirects to `/studio` (authenticated) or `/login`
- `/studio` → Main generation interface (protected)
- `/gallery` → Past generations (protected)
- `/login` → Google OAuth login
- `/auth/callback` → OAuth callback handler
- `/api/generate` → Image generation endpoint

### Data Flow

1. User authenticates via Google OAuth through Supabase
2. User enters text prompt in Studio and clicks "Generate"
3. Client sends prompt to `/api/generate`
4. Server calls Gemini API synchronously (waits for image)
5. Server stores generation record in Supabase PostgreSQL
6. Server uploads result image to Supabase Storage
7. Server returns image URL to client
8. Client displays image in Studio right panel
9. Gallery fetches all user generations from Supabase

### Technical Patterns

- **Server Components by default**, Client Components only where needed (forms, interactivity)
- **API Routes** for backend logic (generation, image handling)
- **TanStack Query** for client-side data fetching and caching
- **React Hook Form + Zod** for form validation
- **Middleware** for route protection (auth checks)

---

## Database Schema

### Profiles Table

```sql
CREATE TABLE profiles (
  id uuid REFERENCES auth.users PRIMARY KEY,
  name text,
  avatar text,
  created_at timestamptz DEFAULT now()
);
```

**Purpose:** Store user profile information from Google OAuth
**Population:** Auto-created via database trigger on `auth.users` insert

### Generations Table

```sql
CREATE TABLE generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user uuid REFERENCES profiles(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  url text,
  status text DEFAULT 'completed',
  error text,
  created_at timestamptz DEFAULT now()
);
```

**Purpose:** Store each image generation attempt
**Status Values:** `completed`, `failed`

### Storage Buckets

**Bucket:** `generations` (public)
**Path Structure:** `{user}/{id}.png`

### Row Level Security (RLS)

**Profiles:**
- Users can read/update only their own profile

**Generations:**
- Users can read/insert/delete only their own generations

**Storage:**
- Users can upload to their own folder
- Users can read their own images

### Indexes

```sql
CREATE INDEX idx_generations_user ON generations(user);
CREATE INDEX idx_generations_created ON generations(created_at DESC);
```

### Database Trigger

```sql
CREATE OR REPLACE FUNCTION create_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, avatar)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile();
```

---

## Studio Implementation

### Route

`/app/studio/page.tsx` (protected route)

### Layout (Split View)

```
┌─────────────────────────────────────────┐
│  Header (Logo, User Menu, Nav)         │
├──────────────────┬──────────────────────┤
│  Left Panel      │  Right Panel         │
│  (40%)           │  (60%)               │
│                  │                      │
│  Prompt Input    │  Generated Image     │
│  (Textarea)      │  Display Area        │
│                  │                      │
│  Generate Button │  (Empty state or     │
│                  │   loading spinner    │
│  Recent Prompts  │   or result image)   │
│  (Quick access)  │                      │
│                  │  Regenerate Button   │
│                  │  Download Button     │
└──────────────────┴──────────────────────┘
```

### Components

**PromptForm** (Client Component)
- React Hook Form + Zod validation
- Textarea for prompt (max 500 characters)
- Character counter
- Submit triggers generation via TanStack Query mutation

**ImageDisplay** (Client Component)
- Shows empty state, loading, result, or error
- Loading: Spinner + "Generating your image..." message
- Success: Image with download/regenerate action buttons
- Error: Error message with retry button

**RecentPrompts** (Client Component)
- Displays last 5 prompts
- Click to populate prompt field
- Fetched from user's recent generations

### Generation Flow

1. User types prompt and clicks "Generate"
2. Form validates (prompt required, max 500 chars)
3. Submit handler calls `useMutation` (TanStack Query)
4. Mutation POSTs to `/api/generate` with prompt
5. Show loading state (disable form, show spinner)
6. API processes synchronously and returns image URL or error
7. Display result in right panel
8. Enable download and regenerate buttons
9. Invalidate queries to refresh recent prompts

### API Route: `/api/generate`

**Input:**
```typescript
{
  prompt: string
}
```

**Process:**
1. Verify user authentication (Supabase session)
2. Validate prompt (Zod schema)
3. Call Gemini API to generate image
4. Convert response to image file (base64 or buffer)
5. Upload to Supabase Storage (`generations/{userId}/{generationId}.png`)
6. Insert generation record into database
7. Return image URL

**Output (Success):**
```typescript
{
  id: string,
  url: string,
  prompt: string,
  created_at: string
}
```

**Output (Error):**
```typescript
{
  error: string
}
```

---

## Gallery Implementation

### Route

`/app/gallery/page.tsx` (protected route)

### Layout

```
┌─────────────────────────────────────────┐
│  Header (Logo, User Menu, Nav)         │
├─────────────────────────────────────────┤
│  Gallery Title + Sort/Filter            │
├─────────────────────────────────────────┤
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐             │
│  │   │ │   │ │   │ │   │  Image Grid  │
│  │ 1 │ │ 2 │ │ 3 │ │ 4 │  (Masonry)   │
│  └───┘ └───┘ └───┘ └───┘             │
│  ┌───┐ ┌───┐ ┌───┐                   │
│  │ 5 │ │ 6 │ │ 7 │                   │
│  └───┘ └───┘ └───┘                   │
└─────────────────────────────────────────┘
```

### Components

**GalleryGrid** (Client Component)
- Responsive grid: 4 columns (desktop), 2 columns (mobile)
- Hover reveals overlay with metadata
- Click opens detail modal

**GenerationCard** (Client Component)
- Displays image thumbnail
- Shows timestamp and prompt preview (first 50 chars)
- Delete button (trash icon)
- Confirm dialog before delete

**GenerationModal** (Client Component)
- Full screen detail view
- Full size image
- Complete prompt text
- Timestamp (formatted: "2 hours ago")
- Actions: Download, Delete, Regenerate
- Regenerate navigates to Studio with prompt pre-filled
- Close button / click outside to dismiss

### Data Fetching

**Server Component:**
- Fetches initial data from Supabase
- Query: `SELECT * FROM generations WHERE user = {userId} ORDER BY created_at DESC`
- Passes data to client component

**Client Component:**
- Uses TanStack Query for delete/regenerate mutations
- Optimistic updates for delete
- Query invalidation after mutations

### States

- **Empty:** "No generations yet" + CTA button to Studio
- **Loading:** Skeleton cards
- **Error:** Error message with retry button
- **Populated:** Grid of generation cards

---

## Authentication Flow

### Login Route

`/app/login/page.tsx` (public route)

### UI

```
┌─────────────────────────────────────────┐
│                                         │
│         Kanojo Studio Logo              │
│                                         │
│    AI-Powered Portrait Photography      │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  🔵  Continue with Google         │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### OAuth Flow

1. User clicks "Continue with Google" button
2. Client calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
3. Browser redirects to Google OAuth consent screen
4. User approves access
5. Google redirects back to `/auth/callback`
6. Callback route exchanges authorization code for session
7. Database trigger creates profile record (first login)
8. Redirect to `/studio`

### Route Protection (Middleware)

**File:** `middleware.ts`

```typescript
export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient()
  const { data: { session } } = await supabase.auth.getSession()

  const pathname = request.nextUrl.pathname

  // Protected routes
  const protectedRoutes = ['/studio', '/gallery']
  const isProtected = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect logged-in users away from login
  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/studio', request.url))
  }

  return response
}
```

### Session Management

- Supabase handles session cookies automatically
- Client components use `useUser()` hook for auth state
- Server components use `createServerClient()` to get session
- Session refresh handled automatically by Supabase SDK
- Session persists across page reloads

---

## Project Structure

```
/app
  /studio
    page.tsx              # Studio UI (protected)
  /gallery
    page.tsx              # Gallery UI (protected)
  /login
    page.tsx              # Login UI (public)
  /auth
    /callback
      route.ts            # OAuth callback handler
  /api
    /generate
      route.ts            # Image generation endpoint
  layout.tsx              # Root layout
  globals.css             # Tailwind styles

/components
  /ui                     # Shadcn UI components
  prompt-form.tsx         # Prompt input form
  image-display.tsx       # Image display area
  generation-card.tsx     # Gallery card component
  generation-modal.tsx    # Full screen image modal
  header.tsx              # App header with nav

/lib
  /supabase
    client.ts             # Browser Supabase client
    server.ts             # Server Supabase client
    middleware.ts         # Middleware Supabase client
  gemini.ts               # Gemini API wrapper
  validations.ts          # Zod schemas
  utils.ts                # Utility functions

/hooks
  use-user.ts             # Authentication hook
  use-generations.ts      # Data fetching hooks

middleware.ts             # Route protection middleware
```

---

## Environment Variables

**File:** `.env.local`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Dependencies

### Core Dependencies

```json
{
  "@supabase/ssr": "latest",
  "@supabase/supabase-js": "latest",
  "@google/generative-ai": "latest",
  "@tanstack/react-query": "latest",
  "react-hook-form": "latest",
  "zod": "latest",
  "lucide-react": "latest"
}
```

### UI Dependencies (Shadcn)

Install as needed via Shadcn CLI:
- Button
- Input
- Textarea
- Card
- Dialog
- Avatar
- Skeleton
- Toast

---

## Gemini API Integration

### SDK

Package: `@google/generative-ai`

### Configuration

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
```

### Model

**Model ID:** `gemini-2.0-flash-exp`

**Capabilities:**
- Text-to-image generation
- Fast inference
- Good quality for MVP

### Generation Example

```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

const result = await model.generateContent({
  contents: [{
    role: 'user',
    parts: [{ text: prompt }]
  }]
});

// Extract image data (base64 or URL)
const imageData = result.response.candidates[0].content.parts[0].inlineData;
```

**Note:** Implementation details will be finalized during development based on Gemini's actual image generation API.

---

## Setup Steps

### 1. Initialize Next.js Project

```bash
npx create-next-app@latest kanojo-studio \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"
```

### 2. Install Dependencies

```bash
npm install @supabase/ssr @supabase/supabase-js
npm install @google/generative-ai
npm install @tanstack/react-query
npm install react-hook-form zod @hookform/resolvers
npm install lucide-react
npm install date-fns # for date formatting
```

### 3. Initialize Shadcn UI

```bash
npx shadcn-ui@latest init
```

### 4. Configure Supabase

**In Supabase Dashboard:**
1. Create new project
2. Enable Google OAuth provider (Authentication → Providers)
3. Set OAuth redirect URL: `http://localhost:3000/auth/callback`
4. Create database tables (run SQL from schema section)
5. Enable RLS policies (provided in schema section)
6. Create storage bucket: `generations` (public)
7. Set storage policies for user folder access

### 5. Configure Gemini API

1. Visit Google AI Studio
2. Generate API key
3. Add to `.env.local`

### 6. Configure Environment Variables

Create `.env.local` with all required variables (see Environment Variables section)

---

## Development Workflow

### Phase 1: Foundation (Week 1)
- Set up Next.js project structure
- Configure Supabase (database, auth, storage)
- Implement authentication (login, callback, middleware)
- Create basic layout and header

### Phase 2: Studio (Week 2)
- Build Studio UI (split view layout)
- Implement PromptForm with validation
- Create `/api/generate` endpoint
- Integrate Gemini API
- Implement image upload to Supabase Storage
- Build ImageDisplay component with states

### Phase 3: Gallery (Week 3)
- Build Gallery UI (grid layout)
- Implement GenerationCard component
- Create GenerationModal
- Implement delete functionality
- Add regenerate (navigate to Studio with prompt)

### Phase 4: Polish (Week 4)
- Responsive design refinements
- Loading states and error handling
- Accessibility improvements
- Performance optimization
- Testing

---

## Success Criteria

### MVP Complete When:

1. ✅ User can sign in with Google OAuth
2. ✅ User can enter text prompt in Studio
3. ✅ System generates image using Gemini API
4. ✅ Generated image displays in Studio
5. ✅ User can download generated image
6. ✅ User can view all past generations in Gallery
7. ✅ User can see prompt and timestamp for each generation
8. ✅ User can delete generations
9. ✅ User can regenerate from past prompt
10. ✅ All routes properly protected with authentication

### Quality Gates:

- Responsive design works on mobile and desktop
- Proper error handling for API failures
- Loading states for all async operations
- Images stored securely in Supabase Storage
- RLS policies prevent unauthorized access
- Clean, maintainable code following Next.js conventions

---

## Future Enhancements (Post-MVP)

- Face Swap integration
- Image-to-Image generation
- The Mixer (rule-based prompt builder)
- Prompt enhancement with Gemini
- Templates system
- Favorites/starring
- Credits and billing
- Dashboard with analytics
- Social features (public gallery)
- Advanced filters and search
- Batch generation
- Export options

---

## Notes

- Keep MVP scope tight - resist feature creep
- Focus on one user flow: authenticate → generate → view
- Optimize for time-to-first-value
- Gather user feedback before adding complexity
- All future features can be added incrementally
