# Buy Credits Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `/credits` page where users can purchase credit packages via Stripe Checkout.

**Architecture:** Native `<form>` POST to `/api/credits/checkout` creates a Stripe Checkout session and redirects the user to Stripe's hosted page. Stripe sends a `checkout.session.completed` webhook to `/api/webhooks/stripe` which uses the Supabase service role client to credit the user's account. The success page at `/credits/success` confirms the purchase.

**Tech Stack:** Stripe (npm: `stripe`), Next.js App Router, Supabase service role client, TypeScript

---

### Task 1: Install Stripe and add env vars

**Files:**
- Modify: `package.json` (via pnpm)
- Modify: `.env.local`

**Step 1: Install stripe package**

```bash
pnpm add stripe
```

Expected: `stripe` appears in `package.json` dependencies.

**Step 2: Add env vars to `.env.local`**

Add these three lines (user already has the values):

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Step 3: Verify**

```bash
node -e "require('./node_modules/stripe')" 2>/dev/null && echo "OK"
```

Expected: `OK`

**Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: install stripe"
```

---

### Task 2: Add CREDIT_PACKAGES constant and service role client

**Files:**
- Modify: `lib/constants.ts`
- Create: `lib/supabase/admin.ts`

**Step 1: Add CREDIT_PACKAGES to `lib/constants.ts`**

Append to the end of the file:

```ts
export const CREDIT_PACKAGES = [
  { id: 'starter', label: 'Starter', credits: 100,  price: 500  },
  { id: 'popular', label: 'Popular', credits: 500,  price: 2000 },
  { id: 'pro',     label: 'Pro',     credits: 1500, price: 5000 },
] as const

export type CreditPackageId = typeof CREDIT_PACKAGES[number]['id']
```

**Step 2: Create `lib/supabase/admin.ts`**

This client uses the service role key and bypasses RLS — only use in server-side webhook handlers.

```ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

**Step 3: Commit**

```bash
git add lib/constants.ts lib/supabase/admin.ts
git commit -m "feat: add credit packages constant and admin supabase client"
```

---

### Task 3: POST /api/credits/checkout route

**Files:**
- Create: `app/api/credits/checkout/route.ts`

**Step 1: Create the route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { CREDIT_PACKAGES, CreditPackageId } from '@/lib/constants'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const packageId = formData.get('packageId') as CreditPackageId

  const pkg = CREDIT_PACKAGES.find(p => p.id === packageId)
  if (!pkg) {
    return NextResponse.json({ error: 'Invalid package' }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: pkg.price,
          product_data: {
            name: `${pkg.credits} Credits — ${pkg.label}`,
            description: `${pkg.credits} credits for Kanojo Studio`,
          },
        },
      },
    ],
    metadata: {
      userId: session.user.id,
      credits: String(pkg.credits),
      packageId: pkg.id,
    },
    success_url: `${baseUrl}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/credits`,
  })

  return NextResponse.redirect(checkoutSession.url!, 303)
}
```

**Step 2: Verify route file exists**

```bash
ls app/api/credits/checkout/route.ts
```

**Step 3: Commit**

```bash
git add app/api/credits/checkout/route.ts
git commit -m "feat: add Stripe checkout session API route"
```

---

### Task 4: POST /api/webhooks/stripe route

**Files:**
- Create: `app/api/webhooks/stripe/route.ts`

**Step 1: Create the route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed` },
      { status: 400 }
    )
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId
    const credits = parseInt(session.metadata?.credits ?? '0', 10)

    if (!userId || !credits) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Add credits to profile
    const { error: profileError } = await supabase.rpc('add_credits', {
      user_uuid: userId,
      amount: credits,
    })

    if (profileError) {
      console.error('Failed to add credits:', profileError)
      return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 })
    }

    // Record transaction
    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'credit_purchase',
      amount: credits,
      related_id: null,
      description: `Purchased ${credits} credits`,
    })
  }

  return NextResponse.json({ received: true })
}
```

**Step 2: Commit**

```bash
git add app/api/webhooks/stripe/route.ts
git commit -m "feat: add Stripe webhook handler"
```

---

### Task 5: Add `add_credits` Postgres function

**Files:**
- Modify: `supabase/schema.sql`

**Step 1: Append to `supabase/schema.sql`**

Add at the end of the file:

```sql
-- Function to safely add credits to a user's profile (used by Stripe webhook)
CREATE OR REPLACE FUNCTION add_credits(user_uuid uuid, amount integer)
RETURNS void
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.profiles
  SET credits = credits + amount
  WHERE id = user_uuid;
$$;
```

**Step 2: Run in Supabase SQL Editor**

Copy the SQL above and run it in the Supabase Dashboard → SQL Editor.

**Step 3: Commit the schema update**

```bash
git add supabase/schema.sql
git commit -m "feat: add add_credits postgres function"
```

---

### Task 6: /credits page

**Files:**
- Create: `app/credits/page.tsx`

**Step 1: Create the page**

```tsx
import { redirect } from 'next/navigation'
import { Sparkle, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CREDIT_PACKAGES } from '@/lib/constants'
import { cn } from '@/lib/utils'

export default async function CreditsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', session.user.id)
    .single()

  const currentCredits = profile?.credits ?? 0

  return (
    <section className="flex w-full flex-col items-center px-8 pb-16 pt-2">
      <div className="w-full max-w-2xl">
        <div className="mb-10">
          <h1 className="text-2xl font-semibold">Buy Credits</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            Current balance:
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Sparkle className="size-3.5 text-yellow-400" />
              {currentCredits}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CREDIT_PACKAGES.map((pkg) => {
            const isPopular = pkg.id === 'popular'
            return (
              <div
                key={pkg.id}
                className={cn(
                  'relative flex flex-col rounded-2xl border p-6 transition-colors',
                  isPopular
                    ? 'border-primary bg-primary/5 ring-2 ring-primary'
                    : 'border-border bg-card hover:border-primary/50'
                )}>
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                    Most Popular
                  </span>
                )}

                <div className="mb-4">
                  <p className="text-sm font-medium text-muted-foreground">{pkg.label}</p>
                  <p className="mt-1 flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                      ${(pkg.price / 100).toFixed(0)}
                    </span>
                    <span className="text-sm text-muted-foreground">USD</span>
                  </p>
                </div>

                <div className="mb-6 flex items-center gap-1.5 text-sm">
                  <Sparkle className="size-4 text-yellow-400" />
                  <span className="font-semibold">{pkg.credits.toLocaleString()}</span>
                  <span className="text-muted-foreground">credits</span>
                </div>

                <form action="/api/credits/checkout" method="POST" className="mt-auto">
                  <input type="hidden" name="packageId" value={pkg.id} />
                  <button
                    type="submit"
                    className={cn(
                      'flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                      isPopular
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    )}>
                    <Zap className="size-4" />
                    Buy Now
                  </button>
                </form>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
```

**Step 2: Commit**

```bash
git add app/credits/page.tsx
git commit -m "feat: add buy credits page"
```

---

### Task 7: /credits/success page

**Files:**
- Create: `app/credits/success/page.tsx`

**Step 1: Create the page**

```tsx
import Link from 'next/link'
import { CheckCircle2, Sparkle } from 'lucide-react'

export default function CreditsPurchaseSuccessPage() {
  return (
    <section className="flex w-full flex-col items-center justify-center px-8 py-24">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle2 className="size-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-semibold">Payment successful</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your credits have been added to your account. Ready to create?
        </p>
        <Link
          href="/studio"
          className="mt-8 flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Sparkle className="size-4" />
          Go to Studio
        </Link>
      </div>
    </section>
  )
}
```

**Step 2: Commit**

```bash
git add app/credits/success/page.tsx
git commit -m "feat: add credits purchase success page"
```

---

### Task 8: Add "Buy credits" entry point in Profile popover

**Files:**
- Modify: `components/credits.tsx`
- Modify: `components/profile.tsx`

**Step 1: Make `Credits` component a link in `components/credits.tsx`**

Wrap the entire `<div>` in a Next.js `<Link href="/credits">`:

```tsx
'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useProfile } from '@/hooks/use-profile'
import { Sparkle } from 'lucide-react'

export interface CreditsProps extends React.HTMLAttributes<HTMLDivElement> {
  prefix?: string
}

export function Credits({ prefix = 'CREDITS', className, ...props }: CreditsProps) {
  const { data: profile, isLoading } = useProfile()

  if (isLoading || profile == null) return null

  return (
    <Link href="/credits" className="w-full">
      <div
        className={cn(
          'flex h-9 items-center justify-between rounded-full px-3',
          'text-xs tabular-nums',
          'cursor-pointer w-full',
          'hover:bg-accent transition-colors',
          className
        )}
        {...props}>
        <div>{prefix}</div>
        <div className="flex items-center gap-1">
          <Sparkle className="size-4 text-yellow-400" />
          {profile.credits}
        </div>
      </div>
    </Link>
  )
}
```

**Step 2: Commit**

```bash
git add components/credits.tsx
git commit -m "feat: make credits balance a link to buy credits page"
```

---

### Task 9: Verify end-to-end with Stripe CLI

**Step 1: Install Stripe CLI (if not already)**

```bash
brew install stripe/stripe-cli/stripe
```

**Step 2: Login and forward webhooks to local dev**

```bash
stripe login
stripe listen --forward-to http://kanojo.dev.io/api/webhooks/stripe
```

Stripe CLI will print a webhook signing secret — make sure it matches `STRIPE_WEBHOOK_SECRET` in `.env.local`.

**Step 3: Run dev server**

```bash
pnpm dev
```

**Step 4: Manual test flow**

1. Navigate to `http://kanojo.dev.io/credits`
2. Verify current balance shown
3. Click "Buy Now" on any package
4. On Stripe Checkout: use test card `4242 4242 4242 4242`, any future date, any CVC
5. Verify redirect to `/credits/success`
6. Verify Stripe CLI shows `checkout.session.completed` → webhook received 200
7. Refresh `/credits` — balance should be increased
8. Check profile popover — credits balance updated

**Step 5: Verify credits link in profile popover**

1. Open profile popover (avatar in top-right)
2. Click credits balance row
3. Should navigate to `/credits`

---

### Task 10: Final commit

```bash
git add -A
git commit -m "feat: buy credits page with Stripe Checkout"
```
