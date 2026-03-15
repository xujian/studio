# Google One Tap Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the redirect-based Google OAuth login with Google One Tap + GSI button, keeping the user on the page throughout.

**Architecture:** Load Google Identity Services script via Next.js `<Script onReady>`, generate a per-session nonce, initialize One Tap with FedCM enabled, and pass the returned credential to `supabase.auth.signInWithIdToken`. A GSI branded button serves as fallback when One Tap is unavailable. Post-login, call `router.refresh()` and let the middleware redirect away from `/login`.

**Tech Stack:** Next.js 16 App Router, `@supabase/ssr`, Google Identity Services (`https://accounts.google.com/gsi/client`), Web Crypto API (nonce generation)

---

### Task 1: Add env variable

**Files:**
- Modify: `.env.local`

**Step 1: Add the Google Client ID**

In `.env.local`, add:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-oauth-client-id>
```

The value is the same OAuth 2.0 Client ID already configured in Supabase under Authentication → Providers → Google. It looks like `xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`.

**Step 2: Verify the value is accessible**

Run the dev server and confirm `process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID` is defined (you can temporarily `console.log` it in the login page and remove it after).

---

### Task 2: Rewrite the login page

**Files:**
- Modify: `app/login/page.tsx`

**Step 1: Replace the file content**

```tsx
'use client'

import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Google Identity Services type shim — only what we need
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: object) => void
          prompt: () => void
          renderButton: (element: HTMLElement, config: object) => void
        }
      }
    }
  }
}

const generateNonce = async (): Promise<[string, string]> => {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(nonce))
  const hashedNonce = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return [nonce, hashedNonce]
}

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const initializeGoogleOneTap = async () => {
    const [nonce, hashedNonce] = await generateNonce()

    // Skip One Tap if already logged in
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      router.refresh()
      return
    }

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      nonce: hashedNonce,
      use_fedcm_for_prompt: true,
      callback: async ({ credential }: { credential: string }) => {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: credential,
          nonce,
        })
        if (!error) router.refresh()
      },
    })

    window.google.accounts.id.prompt()

    // Render the GSI button as fallback
    const buttonEl = document.getElementById('google-signin-button')
    if (buttonEl) {
      window.google.accounts.id.renderButton(buttonEl, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: buttonEl.offsetWidth,
      })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Script
        src="https://accounts.google.com/gsi/client"
        onReady={initializeGoogleOneTap}
      />
      <Card
        className={cn(
          'w-full max-w-md',
          'elevation-3 animate-float-up'
        )}
      >
        <CardContent className="space-y-8 p-8">
          <div className="text-center">
            <h1 className={cn(
              'text-4xl font-bold tracking-tight',
              'glow-primary-hover vibrancy-text'
            )}>
              Kanojo Studio
            </h1>
            <p className="mt-2 text-muted-foreground">
              AI-Powered Portrait Photography
            </p>
          </div>

          <div id="google-signin-button" className="w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 2: Verify it builds without TypeScript errors**

```bash
pnpm build
```

Expected: no type errors. The `declare global` shim covers the `window.google` access without needing a separate `@types/google-one-tap` package.

**Step 3: Smoke test in browser**

```bash
pnpm dev
```

Visit `/login`. You should see:
- One Tap overlay appear automatically (if you're signed into Chrome with a Google account)
- The GSI branded "Sign in with Google" button rendered in the card
- After sign-in: page refreshes and middleware redirects to `/studio`

**Step 4: Commit**

```bash
git add app/login/page.tsx .env.local
git commit -m "feat: replace OAuth redirect with Google One Tap + GSI button"
```
