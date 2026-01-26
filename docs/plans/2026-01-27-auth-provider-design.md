# AuthProvider Design

**Date:** 2026-01-27
**Goal:** Centralize authentication state management to prevent duplicate subscriptions and provide a clean auth API

## Problem Statement

Currently, the `useUser` hook creates a new Supabase auth subscription in every component that uses it. This causes:
- Duplicate `onAuthStateChange` subscriptions
- No centralized place for auth methods (signOut, etc.)
- Potential flickering on protected pages during initial load

## Solution: React Context AuthProvider

Create a single `AuthProvider` component that:
- Maintains one `onAuthStateChange` subscription at the app root
- Exposes auth state and methods via `useAuth()` hook
- Integrates seamlessly with existing provider structure

## Architecture

### File Structure

**New file:**
- `/context/auth-provider.tsx` - Provider component + `useAuth()` hook export

**Modified files:**
- `/context/providers.tsx` - Add `<AuthProvider>` wrapper
- `/components/header.tsx` - Replace `useUser()` with `useAuth()`
- Any other components using `useUser()`

**Deleted files:**
- `/hooks/use-user.ts` - Replaced by `useAuth()`

### Provider Hierarchy

```
<AuthProvider>
  <QueryProvider>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </QueryProvider>
</AuthProvider>
```

**Rationale:** Auth wraps Query because query hooks may depend on auth state.

## Implementation Details

### AuthProvider State

```typescript
const [user, setUser] = useState<User | null>(null)
const [loading, setLoading] = useState(true)
```

### Auth Flow

1. **On mount:** Check for existing session with `supabase.auth.getUser()`
2. **Subscribe:** Single `onAuthStateChange` listener updates user state
3. **Cleanup:** Unsubscribe on unmount
4. **Sign out:** Async method that calls `supabase.auth.signOut()`

### Context API

```typescript
{
  user: User | null,
  loading: boolean,
  signOut: () => Promise<void>
}
```

### Error Handling

The `useAuth()` hook throws if used outside `<AuthProvider>`:
```typescript
if (!context) {
  throw new Error('useAuth must be used within AuthProvider')
}
```

## Why `loading` State?

The initial `supabase.auth.getUser()` call is asynchronous. Without a loading state:
- Components see `user = null` even when logged in
- Protected routes flicker and redirect incorrectly
- UI shows wrong content briefly

With loading state:
- Components can show spinners/skeletons
- Prevents flickering and wrong redirects
- Ensures correct initial render

## Migration Strategy

1. Create `/context/auth-provider.tsx`
2. Update `/context/providers.tsx` to include `<AuthProvider>`
3. Update all components: `useUser()` → `useAuth()`
4. Delete `/hooks/use-user.ts`
5. Test auth flow (initial load, sign in/out, protected routes)

## Design Decisions

**Why not include `session`?**
Keep it simple - most components only need `user`. Session can be added later if needed.

**Why not block QueryProvider until auth loads?**
TanStack Query hooks can handle this with the `enabled` option. No need to block everything.

**Why one file instead of separate hook?**
Simpler - provider and hook are tightly coupled, keeping them together reduces files.

## Success Criteria

- ✅ Single `onAuthStateChange` subscription across entire app
- ✅ No flickering on page load
- ✅ Clean API: `const { user, loading, signOut } = useAuth()`
- ✅ All existing auth functionality works
- ✅ Type-safe with existing `User` type
