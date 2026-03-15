# Google One Tap + GSI Button Design

**Date:** 2026-03-14
**Status:** Approved

## Problem

Current login uses a full-page redirect to google.com via `signInWithOAuth`. This feels dated and breaks the user's flow. Modern apps keep the user on the page using Google's Identity Services (GSI).

## Solution

Replace the redirect-based OAuth flow with Google One Tap + GSI branded button. Both use `signInWithIdToken` — no page navigation to google.com.

## Auth Flow

```
Script loads → onReady fires → generate nonce → check existing session
  → session exists? router.refresh() (middleware redirects away from /login)
  → no session? google.accounts.id.initialize() + prompt()
     → One Tap overlay appears automatically
     → user clicks → credential returned → signInWithIdToken(token, rawNonce) → router.refresh()
     → One Tap dismissed/unavailable → GSI button always visible as fallback → same credential handler
```

## Key Implementation Details

### Nonce (security)
Generate a cryptographic nonce per sign-in attempt using `crypto.getRandomValues`:
- Pass **SHA-256 hashed** version to Google (`nonce` in `initialize()`)
- Pass **raw** version to `signInWithIdToken({ nonce })`
- Prevents replay attacks on the ID token

### FedCM (Chrome compatibility)
Set `use_fedcm_for_prompt: true` in `google.accounts.id.initialize()`.
Required since Chrome removed third-party cookies — without this, One Tap silently fails.

### Script loading
Use Next.js `<Script src="..." onReady={initFn}>` — `onReady` fires after the script executes, avoiding the race condition that `useEffect` or `strategy="afterInteractive"` can cause.

### Post-login navigation
Call `router.refresh()` on success — no hardcoded redirect to `/studio`. The middleware detects the session and redirects authenticated users away from `/login` automatically.

### Session check on init
Before showing One Tap, call `supabase.auth.getSession()`. If a session exists, call `router.refresh()` immediately — avoids flashing One Tap to already-logged-in users.

## Environment Variables

Add to `.env.local`:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-oauth-client-id>
```

Same Google OAuth client ID already configured in Supabase — no new Google Cloud setup needed.

## Files Changed

| File | Change |
|------|--------|
| `app/login/page.tsx` | Rewrite: Script + nonce generation + One Tap init + GSI button |
| `.env.local` | Add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` |

## Files Unchanged

- `app/auth/callback/route.ts` — only used for redirect-based OAuth, not needed here
- `proxy.ts` / middleware — session detection and route protection unchanged
- All hooks, engine, database schema — untouched

## What the Previous Design Missed

- No nonce → security gap (ID token replay possible)
- No `use_fedcm_for_prompt` → broken in Chrome
- Used `strategy="afterInteractive"` instead of `onReady` → race condition on script load
- Hardcoded redirect to `/studio` instead of letting middleware handle routing
