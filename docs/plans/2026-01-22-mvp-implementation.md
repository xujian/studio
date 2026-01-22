# Kanojo Studio MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a minimal viable AI portrait generation platform with Google OAuth, text-to-image generation via Gemini, and generation history gallery.

**Architecture:** Next.js 16 App Router with Supabase (auth, database, storage) and Google Gemini API. Server Components by default, Client Components for interactivity. TanStack Query for data fetching, React Hook Form + Zod for validation.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, Shadcn UI, Supabase, Google Gemini API, TanStack Query, React Hook Form, Zod

---

## Task 1: Project Initialization

**Files:**
- Create: `package.json` (via CLI)
- Create: `.env.local`
- Create: `.env.example`
- Modify: `.gitignore`

**Step 1: Initialize Next.js project**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

Expected: Project scaffolded with TypeScript and Tailwind CSS configured

**Step 2: Install core dependencies**

Run:
```bash
npm install @supabase/ssr @supabase/supabase-js @google/generative-ai @tanstack/react-query react-hook-form zod @hookform/resolvers lucide-react date-fns
```

Expected: All packages installed successfully

**Step 3: Initialize Shadcn UI**

Run:
```bash
npx shadcn@latest init -d
```

When prompted, select:
- Style: Default
- Base color: Slate
- CSS variables: Yes

Expected: `components.json` created, Shadcn configured

**Step 4: Install required Shadcn components**

Run:
```bash
npx shadcn@latest add button input textarea card dialog avatar skeleton toast
```

Expected: Components added to `components/ui/`

**Step 5: Create environment file template**

Create `.env.example`:
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

**Step 6: Update .gitignore**

Ensure `.env.local` is in `.gitignore` (should be there by default)

**Step 7: Commit**

Run:
```bash
git add .
git commit -m "feat: initialize Next.js project with dependencies

- Set up Next.js 16 with TypeScript and Tailwind
- Install Supabase, Gemini, TanStack Query, React Hook Form, Zod
- Configure Shadcn UI with base components
- Add environment variable template

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Supabase Configuration

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/middleware.ts`
- Create: `supabase/schema.sql` (for reference)

**Step 1: Create browser Supabase client**

Create `lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 2: Create server Supabase client**

Create `lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component - cookies can only be set in Server Actions/Route Handlers
          }
        },
      },
    }
  )
}
```

**Step 3: Create middleware Supabase client**

Create `lib/supabase/middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return { supabase, supabaseResponse, session }
}
```

**Step 4: Create schema SQL file for reference**

Create `supabase/schema.sql`:
```sql
-- Profiles table
CREATE TABLE profiles (
  id uuid REFERENCES auth.users PRIMARY KEY,
  name text,
  avatar text,
  created_at timestamptz DEFAULT now()
);

-- Generations table
CREATE TABLE generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user" uuid REFERENCES profiles(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  url text,
  status text DEFAULT 'completed',
  error text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_generations_user ON generations("user");
CREATE INDEX idx_generations_created ON generations(created_at DESC);

-- RLS Policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for generations
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generations"
  ON generations FOR SELECT
  USING (auth.uid() = "user");

CREATE POLICY "Users can insert own generations"
  ON generations FOR INSERT
  WITH CHECK (auth.uid() = "user");

CREATE POLICY "Users can delete own generations"
  ON generations FOR DELETE
  USING (auth.uid() = "user");

-- Function to create profile on signup
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

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile();
```

**Step 5: Commit**

Run:
```bash
git add lib/supabase supabase
git commit -m "feat: configure Supabase clients and schema

- Add browser, server, and middleware Supabase clients
- Create database schema with profiles and generations tables
- Set up RLS policies for data security
- Add trigger for automatic profile creation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Step 6: Manual Supabase setup**

In Supabase Dashboard:
1. Create new project (if not done)
2. Go to SQL Editor and run `supabase/schema.sql`
3. Go to Authentication → Providers → Enable Google
4. Set redirect URL to `http://localhost:3000/auth/callback`
5. Go to Storage → Create bucket `generations` (public)
6. Add storage policy: Users can upload to `{user}/*`
7. Copy project URL and anon key to `.env.local`

---

## Task 3: Authentication Implementation

**Files:**
- Create: `middleware.ts`
- Create: `hooks/use-user.ts`
- Create: `app/login/page.tsx`
- Create: `app/auth/callback/route.ts`

**Step 1: Create authentication middleware**

Create `middleware.ts`:
```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, session } = await updateSession(request)

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

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Step 2: Create useUser hook**

Create `hooks/use-user.ts`:
```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  return { user, loading }
}
```

**Step 3: Create login page**

Create `app/login/page.tsx`:
```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Kanojo Studio</h1>
          <p className="mt-2 text-muted-foreground">
            AI-Powered Portrait Photography
          </p>
        </div>

        <div className="mt-8">
          <Button
            onClick={handleGoogleLogin}
            className="w-full"
            size="lg"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**Step 4: Create OAuth callback handler**

Create `app/auth/callback/route.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to studio after successful login
  return NextResponse.redirect(new URL('/studio', request.url))
}
```

**Step 5: Commit**

Run:
```bash
git add middleware.ts hooks app/login app/auth
git commit -m "feat: implement Google OAuth authentication

- Add middleware for route protection
- Create useUser hook for client-side auth state
- Build login page with Google OAuth button
- Add OAuth callback handler
- Protect /studio and /gallery routes

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Root Layout and Header

**Files:**
- Modify: `app/layout.tsx`
- Create: `components/header.tsx`
- Create: `components/providers.tsx`
- Modify: `app/globals.css`

**Step 1: Create providers component**

Create `components/providers.tsx`:
```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

**Step 2: Create header component**

Create `components/header.tsx`:
```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { useRouter } from 'next/navigation'
import { Sparkles, Image as ImageIcon } from 'lucide-react'

export function Header() {
  const pathname = usePathname()
  const { user } = useUser()
  const supabase = createClient()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return null

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/studio" className="text-xl font-bold">
            Kanojo Studio
          </Link>

          <nav className="flex gap-1">
            <Link href="/studio">
              <Button
                variant={pathname === '/studio' ? 'secondary' : 'ghost'}
                size="sm"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Studio
              </Button>
            </Link>
            <Link href="/gallery">
              <Button
                variant={pathname === '/gallery' ? 'secondary' : 'ghost'}
                size="sm"
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Gallery
              </Button>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback>
              {user.user_metadata?.full_name?.[0] || user.email?.[0]}
            </AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  )
}
```

**Step 3: Update root layout**

Modify `app/layout.tsx`:
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Header } from '@/components/header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Kanojo Studio - AI Portrait Photography',
  description: 'Generate professional AI-powered portrait photos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

**Step 4: Update globals.css for dark mode**

Modify `app/globals.css` - add to the end:
```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
```

**Step 5: Create root page redirect**

Modify `app/page.tsx`:
```typescript
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/studio')
}
```

**Step 6: Commit**

Run:
```bash
git add app/layout.tsx app/page.tsx app/globals.css components/header.tsx components/providers.tsx
git commit -m "feat: add root layout with header and providers

- Create TanStack Query provider wrapper
- Build header with navigation and user menu
- Update root layout with dark mode theme
- Add root page redirect to studio

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Validation Schemas and Utils

**Files:**
- Create: `lib/validations.ts`
- Create: `lib/utils.ts`
- Create: `lib/types.ts`

**Step 1: Create validation schemas**

Create `lib/validations.ts`:
```typescript
import { z } from 'zod'

export const promptSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .max(500, 'Prompt must be less than 500 characters'),
})

export type PromptInput = z.infer<typeof promptSchema>
```

**Step 2: Verify utils exists**

The file `lib/utils.ts` should already exist from Shadcn init. If not, create it:
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Step 3: Create types file**

Create `lib/types.ts`:
```typescript
export type Generation = {
  id: string
  user: string
  prompt: string
  url: string | null
  status: 'completed' | 'failed'
  error: string | null
  created_at: string
}

export type Profile = {
  id: string
  name: string | null
  avatar: string | null
  created_at: string
}
```

**Step 4: Commit**

Run:
```bash
git add lib/validations.ts lib/types.ts lib/utils.ts
git commit -m "feat: add validation schemas and type definitions

- Create Zod schema for prompt validation
- Define TypeScript types for Generation and Profile
- Add utility functions for class name merging

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Gemini API Integration

**Files:**
- Create: `lib/gemini.ts`
- Create: `app/api/generate/route.ts`

**Step 1: Create Gemini API wrapper**

Create `lib/gemini.ts`:
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set')
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function generateImage(prompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp'
    })

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: `Generate a high-quality portrait photograph with the following description: ${prompt}. Make it professional, well-lit, and aesthetically pleasing.`
        }]
      }]
    })

    // Extract image data from response
    // Note: This is a placeholder - actual implementation depends on Gemini's API response format
    const response = result.response
    const imageData = response.candidates?.[0]?.content?.parts?.[0]

    if (!imageData) {
      throw new Error('No image data in response')
    }

    // Return base64 data or URL depending on Gemini's response format
    // This will need adjustment based on actual Gemini API behavior
    return imageData.toString()
  } catch (error) {
    console.error('Gemini API error:', error)
    throw new Error('Failed to generate image')
  }
}
```

**Step 2: Create generate API route**

Create `app/api/generate/route.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { promptSchema } from '@/lib/validations'
import { generateImage } from '@/lib/gemini'

export async function POST(request: Request) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = promptSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { prompt } = validation.data
    const userId = session.user.id

    // Generate image with Gemini
    let imageBase64: string
    try {
      imageBase64 = await generateImage(prompt)
    } catch (error) {
      // Insert failed generation record
      await supabase.from('generations').insert({
        user: userId,
        prompt,
        status: 'failed',
        error: 'Failed to generate image',
      })

      return NextResponse.json(
        { error: 'Failed to generate image' },
        { status: 500 }
      )
    }

    // Create generation record
    const { data: generation, error: insertError } = await supabase
      .from('generations')
      .insert({
        user: userId,
        prompt,
        status: 'completed',
      })
      .select()
      .single()

    if (insertError || !generation) {
      return NextResponse.json(
        { error: 'Failed to save generation' },
        { status: 500 }
      )
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageBase64, 'base64')

    // Upload to Supabase Storage
    const filePath = `${userId}/${generation.id}.png`
    const { error: uploadError } = await supabase.storage
      .from('generations')
      .upload(filePath, imageBuffer, {
        contentType: 'image/png',
        upsert: false,
      })

    if (uploadError) {
      // Update generation with error
      await supabase
        .from('generations')
        .update({
          status: 'failed',
          error: 'Failed to upload image'
        })
        .eq('id', generation.id)

      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('generations')
      .getPublicUrl(filePath)

    // Update generation with URL
    const { data: updatedGeneration, error: updateError } = await supabase
      .from('generations')
      .update({ url: publicUrl })
      .eq('id', generation.id)
      .select()
      .single()

    if (updateError || !updatedGeneration) {
      return NextResponse.json(
        { error: 'Failed to update generation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: updatedGeneration.id,
      url: updatedGeneration.url,
      prompt: updatedGeneration.prompt,
      created_at: updatedGeneration.created_at,
    })
  } catch (error) {
    console.error('Generate API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Step 3: Commit**

Run:
```bash
git add lib/gemini.ts app/api/generate
git commit -m "feat: integrate Gemini API for image generation

- Create Gemini API wrapper with generateImage function
- Build /api/generate endpoint with full flow:
  * Authentication check
  * Prompt validation
  * Image generation via Gemini
  * Storage upload to Supabase
  * Database record creation
- Handle errors at each step

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Studio UI Components

**Files:**
- Create: `hooks/use-generations.ts`
- Create: `components/prompt-form.tsx`
- Create: `components/image-display.tsx`
- Create: `components/recent-prompts.tsx`

**Step 1: Create generations hook**

Create `hooks/use-generations.ts`:
```typescript
'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Generation } from '@/lib/types'

export function useGenerations() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['generations'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return []

      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Generation[]
    },
  })
}

export function useGenerateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (prompt: string) => {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generations'] })
    },
  })
}

export function useDeleteGeneration() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('generations')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generations'] })
    },
  })
}
```

**Step 2: Create prompt form component**

Create `components/prompt-form.tsx`:
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { promptSchema, type PromptInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

type PromptFormProps = {
  onSubmit: (data: PromptInput) => void
  isLoading: boolean
  defaultValue?: string
}

export function PromptForm({ onSubmit, isLoading, defaultValue }: PromptFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PromptInput>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      prompt: defaultValue || '',
    },
  })

  const prompt = watch('prompt')
  const charCount = prompt?.length || 0

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Textarea
          {...register('prompt')}
          placeholder="Describe the portrait you want to create..."
          className="min-h-[200px] resize-none"
          disabled={isLoading}
        />
        <div className="flex items-center justify-between text-sm">
          <span className="text-destructive">
            {errors.prompt?.message}
          </span>
          <span className={charCount > 500 ? 'text-destructive' : 'text-muted-foreground'}>
            {charCount}/500
          </span>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          'Generate'
        )}
      </Button>
    </form>
  )
}
```

**Step 3: Create image display component**

Create `components/image-display.tsx`:
```typescript
'use client'

import { Button } from '@/components/ui/button'
import { Download, RefreshCw, Loader2 } from 'lucide-react'
import Image from 'next/image'

type ImageDisplayProps = {
  imageUrl: string | null
  prompt: string | null
  isLoading: boolean
  error: string | null
  onRegenerate: () => void
}

export function ImageDisplay({
  imageUrl,
  prompt,
  isLoading,
  error,
  onRegenerate,
}: ImageDisplayProps) {
  const handleDownload = async () => {
    if (!imageUrl) return

    const response = await fetch(imageUrl)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kanojo-studio-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">
            Generating your image...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">{error}</p>
          <Button onClick={onRegenerate} className="mt-4" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!imageUrl) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>Your generated image will appear here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1">
        <Image
          src={imageUrl}
          alt={prompt || 'Generated image'}
          fill
          className="object-contain"
          priority
        />
      </div>

      <div className="mt-4 flex gap-2">
        <Button onClick={handleDownload} className="flex-1">
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
        <Button onClick={onRegenerate} variant="outline" className="flex-1">
          <RefreshCw className="mr-2 h-4 w-4" />
          Regenerate
        </Button>
      </div>
    </div>
  )
}
```

**Step 4: Create recent prompts component**

Create `components/recent-prompts.tsx`:
```typescript
'use client'

import { useGenerations } from '@/hooks/use-generations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'

type RecentPromptsProps = {
  onSelectPrompt: (prompt: string) => void
}

export function RecentPrompts({ onSelectPrompt }: RecentPromptsProps) {
  const { data: generations, isLoading } = useGenerations()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Prompts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  const recentPrompts = generations?.slice(0, 5) || []

  if (recentPrompts.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Recent Prompts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {recentPrompts.map((generation) => (
          <Button
            key={generation.id}
            variant="ghost"
            className="w-full justify-start text-left h-auto py-2"
            onClick={() => onSelectPrompt(generation.prompt)}
          >
            <span className="line-clamp-2 text-sm">
              {generation.prompt}
            </span>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
```

**Step 5: Commit**

Run:
```bash
git add hooks/use-generations.ts components/prompt-form.tsx components/image-display.tsx components/recent-prompts.tsx
git commit -m "feat: create Studio UI components

- Add useGenerations hook with query and mutations
- Build PromptForm with validation and character counter
- Create ImageDisplay with loading/error/success states
- Add RecentPrompts component for quick reuse

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Studio Page

**Files:**
- Create: `app/studio/page.tsx`

**Step 1: Create Studio page**

Create `app/studio/page.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { PromptForm } from '@/components/prompt-form'
import { ImageDisplay } from '@/components/image-display'
import { RecentPrompts } from '@/components/recent-prompts'
import { useGenerateMutation } from '@/hooks/use-generations'
import { useRouter } from 'next/navigation'
import type { PromptInput } from '@/lib/validations'

export default function StudioPage() {
  const router = useRouter()
  const [currentImage, setCurrentImage] = useState<{
    url: string
    prompt: string
  } | null>(null)
  const [currentPrompt, setCurrentPrompt] = useState('')

  const generateMutation = useGenerateMutation()

  const handleSubmit = async (data: PromptInput) => {
    setCurrentPrompt(data.prompt)
    try {
      const result = await generateMutation.mutateAsync(data.prompt)
      setCurrentImage({
        url: result.url,
        prompt: result.prompt,
      })
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleSelectPrompt = (prompt: string) => {
    setCurrentPrompt(prompt)
    router.push(`/studio?prompt=${encodeURIComponent(prompt)}`)
  }

  const handleRegenerate = () => {
    if (currentPrompt) {
      handleSubmit({ prompt: currentPrompt })
    }
  }

  return (
    <div className="container mx-auto h-[calc(100vh-4rem)] p-4">
      <div className="grid h-full gap-4 lg:grid-cols-5">
        {/* Left Panel */}
        <div className="space-y-4 lg:col-span-2">
          <PromptForm
            onSubmit={handleSubmit}
            isLoading={generateMutation.isPending}
            defaultValue={currentPrompt}
          />

          <RecentPrompts onSelectPrompt={handleSelectPrompt} />
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-3">
          <div className="h-full rounded-lg border bg-card p-4">
            <ImageDisplay
              imageUrl={currentImage?.url || null}
              prompt={currentImage?.prompt || null}
              isLoading={generateMutation.isPending}
              error={generateMutation.error?.message || null}
              onRegenerate={handleRegenerate}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

Run:
```bash
git add app/studio
git commit -m "feat: build Studio page with split-view layout

- Create Studio page with left/right panel layout
- Integrate PromptForm, ImageDisplay, and RecentPrompts
- Handle generation state and mutations
- Support prompt selection from recent prompts

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Gallery Components

**Files:**
- Create: `components/gallery-grid.tsx`
- Create: `components/generation-card.tsx`
- Create: `components/generation-modal.tsx`

**Step 1: Create generation card component**

Create `components/generation-card.tsx`:
```typescript
'use client'

import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Generation } from '@/lib/types'

type GenerationCardProps = {
  generation: Generation
  onClick: () => void
  onDelete: (id: string) => void
}

export function GenerationCard({
  generation,
  onClick,
  onDelete,
}: GenerationCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this generation?')) {
      onDelete(generation.id)
    }
  }

  if (!generation.url) return null

  return (
    <Card
      className="group relative cursor-pointer overflow-hidden transition-all hover:ring-2 hover:ring-primary"
      onClick={onClick}
    >
      <div className="aspect-square relative">
        <Image
          src={generation.url}
          alt={generation.prompt}
          fill
          className="object-cover"
        />

        <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-full flex-col justify-between p-4">
            <Button
              size="icon"
              variant="destructive"
              className="ml-auto"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <div className="text-white">
              <p className="line-clamp-2 text-sm">
                {generation.prompt}
              </p>
              <p className="mt-1 text-xs text-white/70">
                {formatDistanceToNow(new Date(generation.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
```

**Step 2: Create generation modal component**

Create `components/generation-modal.tsx`:
```typescript
'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Trash2, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { Generation } from '@/lib/types'

type GenerationModalProps = {
  generation: Generation | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (id: string) => void
}

export function GenerationModal({
  generation,
  open,
  onOpenChange,
  onDelete,
}: GenerationModalProps) {
  const router = useRouter()

  if (!generation) return null

  const handleDownload = async () => {
    if (!generation.url) return

    const response = await fetch(generation.url)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kanojo-studio-${generation.id}.png`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this generation?')) {
      onDelete(generation.id)
      onOpenChange(false)
    }
  }

  const handleRegenerate = () => {
    router.push(`/studio?prompt=${encodeURIComponent(generation.prompt)}`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Generation Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {generation.url && (
            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
              <Image
                src={generation.url}
                alt={generation.prompt}
                fill
                className="object-contain"
                priority
              />
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold">Prompt</h3>
            <p className="text-sm text-muted-foreground">
              {generation.prompt}
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            Generated{' '}
            {formatDistanceToNow(new Date(generation.created_at), {
              addSuffix: true,
            })}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleDownload} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button
              onClick={handleRegenerate}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate
            </Button>
            <Button onClick={handleDelete} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 3: Create gallery grid component**

Create `components/gallery-grid.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { GenerationCard } from '@/components/generation-card'
import { GenerationModal } from '@/components/generation-modal'
import { useGenerations, useDeleteGeneration } from '@/hooks/use-generations'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from 'lucide-react'
import type { Generation } from '@/lib/types'

export function GalleryGrid() {
  const { data: generations, isLoading } = useGenerations()
  const deleteMutation = useDeleteGeneration()
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null)

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square" />
        ))}
      </div>
    )
  }

  if (!generations || generations.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No generations yet</p>
          <Button asChild className="mt-4">
            <a href="/studio">
              <Link className="mr-2 h-4 w-4" />
              Go to Studio
            </a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {generations.map((generation) => (
          <GenerationCard
            key={generation.id}
            generation={generation}
            onClick={() => setSelectedGeneration(generation)}
            onDelete={deleteMutation.mutate}
          />
        ))}
      </div>

      <GenerationModal
        generation={selectedGeneration}
        open={!!selectedGeneration}
        onOpenChange={(open) => !open && setSelectedGeneration(null)}
        onDelete={deleteMutation.mutate}
      />
    </>
  )
}
```

**Step 4: Commit**

Run:
```bash
git add components/gallery-grid.tsx components/generation-card.tsx components/generation-modal.tsx
git commit -m "feat: create Gallery UI components

- Build GenerationCard with hover overlay
- Create GenerationModal with full details
- Add GalleryGrid with loading and empty states
- Implement delete and regenerate actions

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Gallery Page

**Files:**
- Create: `app/gallery/page.tsx`

**Step 1: Create Gallery page**

Create `app/gallery/page.tsx`:
```typescript
import { GalleryGrid } from '@/components/gallery-grid'

export default function GalleryPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gallery</h1>
        <p className="text-muted-foreground">
          View all your generated images
        </p>
      </div>

      <GalleryGrid />
    </div>
  )
}
```

**Step 2: Commit**

Run:
```bash
git add app/gallery
git commit -m "feat: create Gallery page

- Build Gallery page with title and grid
- Integrate GalleryGrid component
- Simple layout with header

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Environment Setup and Testing

**Files:**
- Create: `.env.local` (manual, not committed)
- Modify: `README.md`

**Step 1: Create README with setup instructions**

Create or modify `README.md`:
```markdown
# Kanojo Studio MVP

AI-powered portrait photography platform built with Next.js, Supabase, and Google Gemini.

## Features

- Google OAuth authentication
- Text-to-image generation with Gemini API
- Generation history gallery
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

\`\`\`bash
npm install
\`\`\`

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

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### 5. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

\`\`\`
/app                  # Next.js app router
  /studio            # Generation interface
  /gallery           # Generation history
  /login             # Authentication
  /api/generate      # Image generation endpoint
/components          # React components
/hooks               # Custom hooks
/lib                 # Utilities and configs
  /supabase          # Supabase clients
  gemini.ts          # Gemini API wrapper
  validations.ts     # Zod schemas
/supabase            # Database schema
\`\`\`

## Usage

1. Sign in with Google
2. Go to Studio
3. Enter a prompt describing your desired portrait
4. Click Generate
5. View, download, or regenerate images
6. Access all generations in Gallery

## Development Notes

- Server Components by default
- Client Components only where needed
- TanStack Query for data fetching
- Zod for validation
- Dark mode by default

## License

MIT
```

**Step 2: Test the application**

Run:
```bash
npm run dev
```

Manual testing checklist:
1. Visit http://localhost:3000
2. Click "Continue with Google"
3. Authenticate and verify redirect to Studio
4. Enter a prompt and generate (may fail if Gemini API needs adjustment)
5. Check image displays
6. Test download button
7. Navigate to Gallery
8. Verify generations appear
9. Test delete functionality
10. Test regenerate (should go to Studio with prompt)

**Step 3: Commit**

Run:
```bash
git add README.md
git commit -m "docs: add comprehensive README with setup guide

- Document all setup steps for Supabase and Gemini
- Add project structure overview
- Include usage instructions
- List all features and tech stack

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Final Polish and Error Handling

**Files:**
- Create: `app/error.tsx`
- Create: `app/not-found.tsx`
- Create: `components/ui/toaster.tsx` (if not exists)
- Modify: `app/layout.tsx`

**Step 1: Add global error boundary**

Create `app/error.tsx`:
```typescript
'use client'

import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p className="mt-2 text-muted-foreground">
          An error occurred while loading this page
        </p>
        <Button onClick={reset} className="mt-4">
          Try again
        </Button>
      </div>
    </div>
  )
}
```

**Step 2: Add 404 page**

Create `app/not-found.tsx`:
```typescript
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Page Not Found</h2>
        <p className="mt-2 text-muted-foreground">
          The page you're looking for doesn't exist
        </p>
        <Button asChild className="mt-4">
          <Link href="/studio">Go to Studio</Link>
        </Button>
      </div>
    </div>
  )
}
```

**Step 3: Install missing UI component if needed**

Check if card component exists, if not install:
```bash
npx shadcn@latest add card
```

**Step 4: Commit**

Run:
```bash
git add app/error.tsx app/not-found.tsx
git commit -m "feat: add error handling and 404 page

- Create global error boundary
- Add custom 404 page
- Improve user experience for edge cases

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 13: Documentation and Cleanup

**Files:**
- Create: `docs/DEPLOYMENT.md`
- Create: `docs/API.md`

**Step 1: Create deployment guide**

Create `docs/DEPLOYMENT.md`:
```markdown
# Deployment Guide

## Vercel Deployment (Recommended)

### Prerequisites
- Vercel account
- Supabase project configured
- Gemini API key

### Steps

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   Add all variables from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_APP_URL` (use your Vercel URL)

4. **Update Supabase Redirect URLs**
   - Go to Supabase Dashboard
   - Authentication → URL Configuration
   - Add: `https://your-app.vercel.app/auth/callback`

5. **Deploy**
   - Click Deploy
   - Wait for build to complete
   - Visit your URL

### Post-Deployment

1. Test authentication flow
2. Generate a test image
3. Check storage uploads
4. Verify Gallery works

## Custom Domain

1. Go to Vercel project settings
2. Add custom domain
3. Update DNS records
4. Update Supabase redirect URLs

## Troubleshooting

### Authentication Issues
- Verify redirect URLs in Supabase match deployment URL
- Check environment variables are set correctly

### Image Generation Fails
- Verify Gemini API key is valid
- Check API quotas and limits
- Review server logs in Vercel

### Database Errors
- Verify RLS policies are enabled
- Check service role key is correct
- Review Supabase logs
```

**Step 2: Create API documentation**

Create `docs/API.md`:
```markdown
# API Documentation

## POST /api/generate

Generate an AI portrait image from a text prompt.

### Authentication
Requires valid Supabase session cookie.

### Request Body
\`\`\`json
{
  "prompt": "string (1-500 characters, required)"
}
\`\`\`

### Response (Success - 200)
\`\`\`json
{
  "id": "uuid",
  "url": "https://...",
  "prompt": "string",
  "created_at": "ISO 8601 timestamp"
}
\`\`\`

### Response (Error - 400)
\`\`\`json
{
  "error": "Validation error message"
}
\`\`\`

### Response (Error - 401)
\`\`\`json
{
  "error": "Unauthorized"
}
\`\`\`

### Response (Error - 500)
\`\`\`json
{
  "error": "Failed to generate image"
}
\`\`\`

### Process Flow
1. Validate authentication
2. Validate prompt
3. Generate image with Gemini
4. Create database record
5. Upload image to Supabase Storage
6. Return public URL

### Rate Limits
Currently unlimited. Consider adding rate limiting for production.

### Example
\`\`\`javascript
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'A professional portrait of a woman in natural lighting'
  })
})

const data = await response.json()
\`\`\`
```

**Step 3: Final commit**

Run:
```bash
git add docs
git commit -m "docs: add deployment and API documentation

- Create comprehensive deployment guide for Vercel
- Document API endpoints and responses
- Add troubleshooting section

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Step 4: Tag release**

Run:
```bash
git tag -a v1.0.0-mvp -m "MVP Release: Core text-to-image generation"
git push origin v1.0.0-mvp
```

---

## Success Criteria Checklist

Before considering MVP complete, verify:

- [ ] User can sign in with Google OAuth
- [ ] User can enter text prompt in Studio
- [ ] System generates image using Gemini API
- [ ] Generated image displays in Studio
- [ ] User can download generated image
- [ ] User can view all past generations in Gallery
- [ ] User can see prompt and timestamp for each generation
- [ ] User can delete generations
- [ ] User can regenerate from past prompt
- [ ] All routes properly protected with authentication
- [ ] Responsive design works on mobile and desktop
- [ ] Proper error handling for API failures
- [ ] Loading states for all async operations
- [ ] Images stored securely in Supabase Storage
- [ ] RLS policies prevent unauthorized access

---

## Notes for Implementation

### Gemini API Caveat
The Gemini API integration in Task 6 may need adjustment based on the actual API response format. If Gemini doesn't support direct text-to-image generation, consider:
1. Using Imagen API instead
2. Using a different image generation service (Replicate, Stability AI)
3. Switching to DALL-E via OpenAI

### Testing Strategy
This plan doesn't include automated tests to keep the MVP scope tight. For production, add:
- Unit tests for utilities and hooks
- Integration tests for API routes
- E2E tests for critical flows

### Performance Optimization
Post-MVP considerations:
- Add image optimization (next/image already helps)
- Implement pagination for Gallery
- Add caching for Gemini API responses
- Optimize bundle size

### Security Hardening
Before production:
- Add rate limiting to /api/generate
- Implement CSRF protection
- Add content moderation for prompts
- Set up monitoring and alerts
