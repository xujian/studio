---
name: Common mistakes and patterns reference
description: Recurring gotchas and correct patterns to prevent repeated mistakes in Kanojo Studio
type: feedback
---

## Supabase Client Selection

| Context | Import | File |
|---------|--------|------|
| Client Component | `import { createClient } from '@/lib/supabase/client'` | `lib/supabase/client.ts` |
| Server Component / API Route | `import { createClient } from '@/lib/supabase/server'` | `lib/supabase/server.ts` |
| Middleware (`proxy.ts`) | `import { updateSession } from '@/lib/supabase/middleware'` | `lib/supabase/middleware.ts` |

**Why:** Using server client in browser throws; browser client in API route causes silent session miss (auth appears to work but returns no user).

---

## Photo Delta Merging

Photos store only *differences* from their parent moment. Always merge before displaying:

```typescript
const prompt = photo.prompt || moment.prompt
const mixins = { ...moment.mixins, ...photo.mixins }
```

**Why:** Photo fields are nullable deltas. Using `photo.prompt` directly returns null when the moment baseline prompt was used.

---

## Asset URL vs Storage Path

`assets.url` / `assets.path` is a **storage path**, not a public URL. Use Supabase's `getPublicUrl()` to get a displayable URL:

```typescript
const { data } = supabase.storage.from('assets').getPublicUrl(asset.path)
// data.publicUrl is the actual URL
```

**Why:** Directly rendering a storage path as `src` silently shows a broken image.

---

## TanStack Query Hook Pattern

Required structure for all hooks in `/hooks/`:

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export const useFoo = () => {
  const supabase = createClient()

  return useQuery({
    queryKey: ['foo'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return []          // ← session guard required
      // ...
    },
    staleTime: 5 * 60 * 1000          // ← always set staleTime
  })
}
```

For mutations: call `queryClient.invalidateQueries` in `onSuccess` to keep cache fresh.

---

## `'use client'` Directive

Any component that imports from `/hooks/` **must** have `'use client'` at the top. React will throw at runtime otherwise — and the error message often points to the wrong file.

---

## Database Has 9 Tables (not 5)

CLAUDE.md documents `profiles`, `moments`, `photos`, `assets`, `purchases`. The schema also has:

- **`posts`** — community sharing; one moment → one post (UNIQUE constraint)
- **`likes`** — user-post many-to-many; one like per user per post
- **`transactions`** — credit ledger; `amount` is signed int (negative = debit); types: `asset_purchase`, `generation_cost`, `credit_purchase`, `refund`
- **`subscriptions`** — one active Stripe sub per user; tiers: `free`, `basic`, `pro`, `max`; `profiles` also has `stripe_customer_id` and `subscription_tier` columns

---

## Credits Are Integers

`profiles.credits` stores integer credits — **not** cents. Convert Stripe amounts before writing:

```typescript
// Stripe amount is in cents, credits are 1:1 with dollars
const credits = stripeAmountInCents / 100
```

---

## Commit Format

```
feat|fix|refactor|docs|style|test|chore: short description

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```
