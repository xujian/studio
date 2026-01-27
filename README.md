# Kanojo Studio MVP

AI-powered portrait photography platform built with Next.js, Supabase, and Google Gemini.

## Features

- Google OAuth authentication
- Text-to-image generation with Gemini API
- Generation history store
- Download and regenerate images

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database & Auth:** Supabase
- **AI:** Google Gemini API
- **UI:** Shadcn UI + Tailwind CSS
- **State:** TanStack Query
- **Forms:** React Hook Form + Zod

## Setup

### 1. Clone and Install

```bash
pnpm install
```

### 2. Configure Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL in `supabase/schema.sql` in the SQL Editor
3. Enable Google OAuth in Authentication → Providers
4. Set redirect URL: `http://localhost:3000/auth/callback`
5. Create storage bucket `generations` (public)
6. Add storage policy for user uploads

### 3. Configure Gemini API

1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to `.env.local`

### 4. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
GEMINI_API_KEY=your_gemini_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
/app                  # Next.js app router
  /studio            # Generation interface
  /store             # Generation history
  /login             # Authentication
  /api/generate      # Image generation endpoint
/components          # React components
/hooks               # Custom hooks
/lib                 # Utilities and configs
  /supabase          # Supabase clients
  gemini.ts          # Gemini API wrapper
  validations.ts     # Zod schemas
/supabase            # Database schema
```

## Usage

1. Sign in with Google
2. Go to Studio
3. Enter a prompt describing your desired portrait
4. Click Generate
5. View, download, or regenerate images
6. Access all generations in Store

## Development Notes

- Server Components by default
- Client Components only where needed
- TanStack Query for data fetching
- Zod for validation
- Dark mode by default

## License

MIT
