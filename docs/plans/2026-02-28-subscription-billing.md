# Subscription Billing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Stripe Billing subscription tiers (Basic $9, Pro $19, Max $39) alongside the existing one-time credit packs, with monthly credit resets and self-service billing via Stripe Customer Portal.

**Architecture:** Subscriptions are created via Stripe Checkout (`mode: 'subscription'`). The existing webhook handler is extended to process subscription lifecycle events (`invoice.payment_succeeded`, `customer.subscription.deleted`, etc.), which reset or revoke credits each billing cycle. A new `/api/credits/portal` route redirects users to Stripe's hosted Customer Portal for plan changes, cancellations, and invoice history — no custom billing UI needed.

**Tech Stack:** Next.js 16 App Router, Stripe SDK (`stripe@20`), Supabase (postgres functions + RLS), TypeScript

---

## Pre-requisites (Manual — do before writing any code)

### Step 1: Create Stripe Products and Prices

In [Stripe Dashboard → Products](https://dashboard.stripe.com/products), create 3 products with **recurring monthly** prices:

| Product Name | Price | Interval |
|---|---|---|
| Basic Plan | $9.00 | monthly |
| Prp Plan | $19.00 | monthly |
| Max Plan | $39.00 | monthly |

After creating each price, copy the **Price ID** (format: `price_xxxxxxxx`).

### Step 2: Add env vars to `.env.local`

```env
STRIPE_BASIC_PRICE_ID=price_xxxxxxxxxx
STRIPE_PRO_PRICE_ID=price_xxxxxxxxxx
STRIPE_MAX_PRICE_ID=price_xxxxxxxxxx
```

### Step 3: Enable Customer Portal in Stripe

Go to [Stripe Dashboard → Settings → Billing → Customer Portal](https://dashboard.stripe.com/settings/billing/portal) and enable it. Check "Allow customers to cancel subscriptions" and "Allow customers to switch plans".

---

## Task 1: Database Schema

**Files:**
- Modify: `supabase/schema.sql`

### Step 1: Add columns and table to schema.sql

Add after the `profiles` table definition (around line 12):

```sql
-- Add subscription tracking to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free';
-- Values: 'free' | 'basic' | 'pro' | 'max'
```

Add after the `transactions` table (around line 90):

```sql
-- Subscriptions table (active subscription per user)
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  tier text NOT NULL, -- 'basic' | 'pro' | 'max'
  status text NOT NULL, -- 'active' | 'past_due' | 'canceled'
  current_period_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
```

Add RLS for subscriptions after the transactions RLS block:

```sql
-- Subscriptions RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);
```

### Step 2: Add reset_subscription_credits postgres function

Add near the `add_credits` function (end of schema.sql):

```sql
-- Function to reset credits at the start of a new billing period
CREATE OR REPLACE FUNCTION reset_subscription_credits(user_uuid uuid, tier text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  credit_amount integer;
BEGIN
  -- Map tier to credit amount
  credit_amount := CASE tier
    WHEN 'basic'   THEN 100
    WHEN 'pro' THEN 300
    WHEN 'max'     THEN 800
    ELSE 0
  END;

  IF credit_amount = 0 THEN
    RAISE EXCEPTION 'Unknown subscription tier: %', tier;
  END IF;

  UPDATE public.profiles
  SET credits = credit_amount
  WHERE id = user_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user_uuid: %', user_uuid;
  END IF;

  INSERT INTO public.transactions (user_id, type, amount, description)
  VALUES (
    user_uuid,
    'credit_purchase',
    credit_amount,
    'Monthly subscription reset: ' || tier || ' plan (' || credit_amount || ' credits)'
  );
END;
$$;
```

### Step 3: Apply schema changes to Supabase

Run the new SQL in Supabase Dashboard → SQL Editor. Only run the new blocks — do not re-run the full schema.sql (it will fail on existing objects).

Verify in Table Editor:
- `profiles` table has `stripe_customer_id` and `subscription_tier` columns
- `subscriptions` table exists

---

## Task 2: Constants and Types

**Files:**
- Modify: `lib/constants.ts`
- Modify: `lib/types.ts`

### Step 1: Add SUBSCRIPTION_PLANS to constants.ts

Add after `CREDIT_PACKAGES`:

```typescript
export const SUBSCRIPTION_PLANS = [
  {
    id: 'basic' as const,
    label: 'Basic',
    price: 900,         // cents
    credits: 100,
    stripePriceId: process.env.STRIPE_BASIC_PRICE_ID!,
    description: 'For casual creators',
  },
  {
    id: 'pro' as const,
    label: 'pro',
    price: 1900,
    credits: 300,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID!,
    description: 'For regular users',
    popular: true,
  },
  {
    id: 'max' as const,
    label: 'Max',
    price: 3900,
    credits: 800,
    stripePriceId: process.env.STRIPE_MAX_PRICE_ID!,
    description: 'For power users',
  },
] as const

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'max'
export type SubscriptionPlanId = typeof SUBSCRIPTION_PLANS[number]['id']
```

### Step 2: Add Subscription type and update Profile in types.ts

Update `Profile`:

```typescript
export type Profile = {
  id: string
  name: string | null
  avatar: string | null
  credits: number
  stripe_customer_id: string | null  // add this
  subscription_tier: SubscriptionTier // add this
  created_at: string
}
```

Add `Subscription` type (after `Transaction`):

```typescript
export type Subscription = {
  id: string
  user_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  tier: SubscriptionTier
  status: 'active' | 'past_due' | 'canceled'
  current_period_end: string
  created_at: string
  updated_at: string
}
```

Import `SubscriptionTier` in types.ts:

```typescript
import { SubscriptionTier } from './constants'
```

### Step 3: Verify TypeScript compiles

```bash
pnpm build 2>&1 | head -30
```

Expected: No type errors on the changed files.

---

## Task 3: Checkout Route (Support Subscription Mode)

**Files:**
- Modify: `app/api/credits/checkout/route.ts`

### Step 1: Rewrite checkout route to handle both modes

Replace the entire file content:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CREDIT_PACKAGES, SUBSCRIPTION_PLANS } from '@/lib/constants'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const packageId = formData.get('packageId') as string
  const planId = formData.get('planId') as string
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!

  // --- One-time credit pack ---
  if (packageId) {
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId)
    if (!pkg) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 })
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: pkg.price,
          product_data: {
            name: `${pkg.credits} Credits — ${pkg.label}`,
            description: `${pkg.credits} credits for Kanojo Studio`,
          },
        },
      }],
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

  // --- Subscription ---
  if (planId) {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId)
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Retrieve or use existing Stripe customer ID
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_customer_id, subscription_tier')
      .eq('id', session.user.id)
      .single()

    // Prevent subscribing if already on this tier
    if (profile?.subscription_tier === planId) {
      return NextResponse.redirect(`${baseUrl}/credits`, 303)
    }

    const customerParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      metadata: {
        userId: session.user.id,
        planId: plan.id,
        credits: String(plan.credits),
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          planId: plan.id,
          credits: String(plan.credits),
        },
      },
      success_url: `${baseUrl}/credits/success?session_id={CHECKOUT_SESSION_ID}&type=subscription`,
      cancel_url: `${baseUrl}/credits`,
    }

    // Attach existing Stripe customer if we have one
    if (profile?.stripe_customer_id) {
      customerParams.customer = profile.stripe_customer_id
    } else {
      customerParams.customer_email = session.user.email
    }

    const checkoutSession = await stripe.checkout.sessions.create(customerParams)
    return NextResponse.redirect(checkoutSession.url!, 303)
  }

  return NextResponse.json({ error: 'Missing packageId or planId' }, { status: 400 })
}
```

### Step 2: Verify the file compiles

```bash
pnpm build 2>&1 | grep "checkout"
```

Expected: No errors.

---

## Task 4: Customer Portal Route

**Files:**
- Create: `app/api/credits/portal/route.ts`

### Step 1: Create the portal route

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', session.user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${baseUrl}/credits`,
  })

  return NextResponse.redirect(portalSession.url, 303)
}
```

---

## Task 5: Webhook — Subscription Lifecycle Events

**Files:**
- Modify: `app/api/webhooks/stripe/route.ts`

### Step 1: Extend webhook to handle subscription events

Replace the entire file:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // ─── One-time credit purchase ─────────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ received: true })
    }

    // Save stripe_customer_id on the profile (useful for future subscriptions)
    if (session.customer && session.metadata?.userId) {
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: session.customer as string })
        .eq('id', session.metadata.userId)
        .is('stripe_customer_id', null) // only set if not already set
    }

    // Handle subscription checkout — record subscription row
    if (session.mode === 'subscription') {
      const subscriptionId = session.subscription as string
      const userId = session.metadata?.userId
      const planId = session.metadata?.planId
      const credits = parseInt(session.metadata?.credits ?? '0', 10)

      if (!userId || !planId || !credits) {
        return NextResponse.json({ error: 'Missing subscription metadata' }, { status: 400 })
      }

      const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: session.customer as string,
        tier: planId,
        status: 'active',
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      }, { onConflict: 'user_id' })

      await supabase
        .from('profiles')
        .update({ subscription_tier: planId })
        .eq('id', userId)

      // Grant first month of credits
      const { error } = await supabase.rpc('reset_subscription_credits', {
        user_uuid: userId,
        tier: planId,
      })
      if (error) {
        console.error('Failed to grant initial subscription credits:', error)
        return NextResponse.json({ error: 'Failed to grant credits' }, { status: 500 })
      }

      return NextResponse.json({ received: true })
    }

    // Handle one-time credit pack purchase
    const userId = session.metadata?.userId
    const credits = parseInt(session.metadata?.credits ?? '0', 10)

    if (!userId || !credits) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('transactions')
      .select('id')
      .eq('stripe_session_id', session.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ received: true })
    }

    const { error: profileError } = await supabase.rpc('add_credits', {
      user_uuid: userId,
      amount: credits,
    })

    if (profileError) {
      console.error('Failed to add credits:', profileError)
      return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 })
    }

    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'credit_purchase',
      amount: credits,
      related_id: null,
      stripe_session_id: session.id,
      description: `Purchased ${credits} credits`,
    })
  }

  // ─── Monthly renewal ──────────────────────────────────────────────────────
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice
    // Skip the first invoice — handled by checkout.session.completed above
    if (invoice.billing_reason === 'subscription_create') {
      return NextResponse.json({ received: true })
    }

    const subscriptionId = invoice.subscription as string
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
    const userId = stripeSubscription.metadata?.userId
    const planId = stripeSubscription.metadata?.planId

    if (!userId || !planId) {
      console.error('Missing subscription metadata on renewal', subscriptionId)
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    // Update subscription period
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId)

    // Reset credits for new billing period
    const { error } = await supabase.rpc('reset_subscription_credits', {
      user_uuid: userId,
      tier: planId,
    })

    if (error) {
      console.error('Failed to reset subscription credits:', error)
      return NextResponse.json({ error: 'Failed to reset credits' }, { status: 500 })
    }
  }

  // ─── Payment failed ───────────────────────────────────────────────────────
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const subscriptionId = invoice.subscription as string

    await supabase
      .from('subscriptions')
      .update({ status: 'past_due', updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', subscriptionId)
  }

  // ─── Subscription canceled ────────────────────────────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const userId = subscription.metadata?.userId

    await supabase
      .from('subscriptions')
      .update({ status: 'canceled', updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', subscription.id)

    if (userId) {
      await supabase
        .from('profiles')
        .update({ subscription_tier: 'free' })
        .eq('id', userId)
    }
  }

  // ─── Plan upgrade/downgrade ───────────────────────────────────────────────
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription
    const userId = subscription.metadata?.userId
    const planId = subscription.metadata?.planId

    if (userId && planId) {
      await supabase
        .from('subscriptions')
        .update({
          tier: planId,
          status: subscription.status as 'active' | 'past_due' | 'canceled',
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id)

      await supabase
        .from('profiles')
        .update({ subscription_tier: planId })
        .eq('id', userId)
    }
  }

  return NextResponse.json({ received: true })
}
```

### Step 2: Register new webhook events in Stripe CLI / Dashboard

Add these events to your Stripe webhook endpoint:
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.deleted`
- `customer.subscription.updated`

If using Stripe CLI locally:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe \
  --events checkout.session.completed,invoice.payment_succeeded,invoice.payment_failed,customer.subscription.deleted,customer.subscription.updated
```

---

## Task 6: Credits Page — Add Subscription UI

**Files:**
- Modify: `app/credits/page.tsx`

### Step 1: Rewrite the page to show both subscription plans and credit packs

```typescript
import { redirect } from 'next/navigation'
import { Sparkle, Zap, Check, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CREDIT_PACKAGES, SUBSCRIPTION_PLANS } from '@/lib/constants'
import type { Subscription } from '@/lib/types'
import { cn } from '@/lib/utils'

export default async function CreditsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('credits, subscription_tier')
    .eq('id', session.user.id)
    .single()

  const { data: subscription } = await admin
    .from('subscriptions')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .maybeSingle() as { data: Subscription | null }

  const currentCredits = profile?.credits ?? 0
  const currentTier = profile?.subscription_tier ?? 'free'
  const hasSubscription = !!subscription

  return (
    <section className="flex w-full flex-col items-center px-8 pb-16 pt-2">
      <div className="w-full max-w-3xl space-y-12">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold">Plans & Credits</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            Current balance:
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Sparkle className="size-3.5 text-yellow-400" />
              {currentCredits}
            </span>
          </p>
        </div>

        {/* Subscription Plans */}
        <div>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Monthly Plans
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isCurrentPlan = currentTier === plan.id
              const isPopular = plan.popular

              return (
                <div
                  key={plan.id}
                  className={cn(
                    'relative flex flex-col rounded-2xl border p-6 transition-colors',
                    isPopular
                      ? 'border-primary bg-primary/5 ring-2 ring-primary'
                      : 'border-border bg-card hover:border-primary/50',
                    isCurrentPlan && 'ring-2 ring-green-500 border-green-500'
                  )}>
                  {isPopular && !isCurrentPlan && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                      Most Popular
                    </span>
                  )}
                  {isCurrentPlan && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-3 py-0.5 text-xs font-medium text-white">
                      Current Plan
                    </span>
                  )}

                  <div className="mb-4">
                    <p className="text-sm font-medium text-muted-foreground">{plan.label}</p>
                    <p className="mt-1 flex items-baseline gap-1">
                      <span className="text-3xl font-bold">${(plan.price / 100).toFixed(0)}</span>
                      <span className="text-sm text-muted-foreground">/mo</span>
                    </p>
                  </div>

                  <div className="mb-6 flex items-center gap-1.5 text-sm">
                    <Sparkle className="size-4 text-yellow-400" />
                    <span className="font-semibold">{plan.credits.toLocaleString()}</span>
                    <span className="text-muted-foreground">credits/mo</span>
                  </div>

                  <p className="mb-6 text-xs text-muted-foreground">{plan.description}</p>

                  {isCurrentPlan ? (
                    <form action="/api/credits/portal" method="POST" className="mt-auto">
                      <button
                        type="submit"
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80">
                        <CreditCard className="size-4" />
                        Manage Plan
                      </button>
                    </form>
                  ) : (
                    <form action="/api/credits/checkout" method="POST" className="mt-auto">
                      <input type="hidden" name="planId" value={plan.id} />
                      <button
                        type="submit"
                        className={cn(
                          'flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                          isPopular
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        )}>
                        <Zap className="size-4" />
                        {hasSubscription ? 'Switch Plan' : 'Subscribe'}
                      </button>
                    </form>
                  )}
                </div>
              )
            })}
          </div>
          {hasSubscription && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Credits reset on{' '}
              {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric'
              })}
            </p>
          )}
        </div>

        {/* One-time Credit Packs */}
        <div>
          <h2 className="mb-1 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Top-up Credits
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            One-time purchase. Credits never expire.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {CREDIT_PACKAGES.map((pkg) => (
              <div key={pkg.id} className="flex flex-col rounded-2xl border border-border bg-card p-6 hover:border-primary/50 transition-colors">
                <div className="mb-4">
                  <p className="text-sm font-medium text-muted-foreground">{pkg.label}</p>
                  <p className="mt-1 flex items-baseline gap-1">
                    <span className="text-3xl font-bold">${(pkg.price / 100).toFixed(0)}</span>
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
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80">
                    <Zap className="size-4" />
                    Buy Now
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
```

---

## Task 7: End-to-End Manual Testing

### Step 1: Test subscription checkout

1. Open `http://localhost:3000/credits`
2. Click "Subscribe" on the Creator plan
3. Stripe should open with the $19/mo subscription form
4. Complete with test card `4242 4242 4242 4242`, any expiry/CVV
5. Should redirect to `/credits/success`
6. Check Supabase → `subscriptions` table: row should exist with `status = 'active'`
7. Check Supabase → `profiles` table: `subscription_tier = 'creator'`, `credits = 300`
8. Check Supabase → `transactions`: one row with `type = 'credit_purchase'`, `amount = 300`

### Step 2: Test Customer Portal

1. On `/credits` page, the Creator card should now show "Manage Plan" button
2. Click it — should redirect to Stripe's hosted portal
3. Stripe portal should show active subscription with cancel option

### Step 3: Test subscription cancellation

1. In Stripe portal, cancel the subscription
2. Return to app
3. Webhook should fire `customer.subscription.deleted`
4. Check `profiles.subscription_tier` → should be `'free'`
5. Check `subscriptions.status` → should be `'canceled'`

### Step 4: Test one-time pack still works

1. On `/credits` page, click "Buy Now" on a credit pack
2. Complete Stripe checkout
3. Credits should add on top of subscription credits

### Step 5: Test Stripe CLI renewal simulation

```bash
stripe trigger invoice.payment_succeeded
```

Check that credits reset (to tier amount) and `subscriptions.current_period_end` updates.

---

## Commit Sequence

```bash
# After Task 1
git add supabase/schema.sql
git commit -m "feat: add subscriptions table and reset_subscription_credits function"

# After Task 2
git add lib/constants.ts lib/types.ts
git commit -m "feat: add SUBSCRIPTION_PLANS constant and Subscription type"

# After Task 3
git add app/api/credits/checkout/route.ts
git commit -m "feat: support subscription mode in checkout route"

# After Task 4
git add app/api/credits/portal/route.ts
git commit -m "feat: add Stripe Customer Portal redirect route"

# After Task 5
git add app/api/webhooks/stripe/route.ts
git commit -m "feat: handle subscription lifecycle webhook events"

# After Task 6
git add app/credits/page.tsx
git commit -m "feat: redesign credits page with subscription plans and top-up packs"
```
