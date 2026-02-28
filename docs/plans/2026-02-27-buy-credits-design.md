# Buy Credits Page — Design

## Overview

Dedicated `/credits` page where users can purchase credit packages via Stripe Checkout.

## Architecture

### Flow
```
User clicks "Buy Credits" → /credits
  → picks package → POST /api/credits/checkout (form submit)
  → Stripe Checkout session created → redirect to Stripe hosted page
  → Stripe redirects to /credits/success?session_id=xxx
  → webhook POST /api/webhooks/stripe → credits added to profile
```

### Credit Packages (hardcoded in constants)
```ts
{ id: 'starter', label: 'Starter', credits: 100,  price: 500  }  // $5
{ id: 'popular', label: 'Popular', credits: 500,  price: 2000 }  // $20 — highlighted
{ id: 'pro',     label: 'Pro',     credits: 1500, price: 5000 }  // $50
// price in cents (Stripe standard)
```

## Files to Create

### Pages
- `app/credits/page.tsx` — server component, shows balance + package cards
- `app/credits/success/page.tsx` — confirmation page after Stripe redirect

### API Routes
- `app/api/credits/checkout/route.ts` — creates Stripe Checkout session
- `app/api/webhooks/stripe/route.ts` — handles `checkout.session.completed`

### Updates
- `components/credits.tsx` — add "Buy more" link → `/credits`
- `lib/constants.ts` — add `CREDIT_PACKAGES`
- `supabase/schema.sql` — add `transactions` insert in webhook (via service role)

## API Route Details

### POST /api/credits/checkout
- Reads `packageId` from FormData
- Authenticates user via Supabase server client
- Creates Stripe Checkout session (mode: 'payment')
  - `metadata: { userId, credits }` — used by webhook
  - `success_url`: `/credits/success?session_id={CHECKOUT_SESSION_ID}`
  - `cancel_url`: `/credits`
- Returns `redirect(session.url)`

### POST /api/webhooks/stripe
- Verifies Stripe signature with `STRIPE_WEBHOOK_SECRET`
- Handles `checkout.session.completed`
- Uses Supabase service role client (bypasses RLS — justified for server-to-server)
- Updates: `profiles SET credits = credits + N WHERE id = userId`
- Inserts: `transactions` row (type: 'credit_purchase', amount: +N)
- Returns 200 immediately

## Environment Variables

```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_SERVICE_ROLE_KEY=...
```

## UI

```
/credits page:
┌─────────────────────────────────┐
│  Buy Credits                    │
│  Current balance: ✦ 247         │
│                                 │
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │Start │ │Popular│ │ Pro  │   │
│  │ 100  │ │  500  │ │ 1500 │   │
│  │credits│ │credits│ │credits│  │
│  │  $5  │ │  $20  │ │  $50 │   │
│  │ BUY  │ │  BUY  │ │  BUY │   │
│  └──────┘ └──────┘ └──────┘   │
│      Popular: ring highlight    │
│              + "Most Popular"   │
└─────────────────────────────────┘

/credits/success:
  "Payment successful — X credits added to your account"
  [Go to Studio] button
```

## Notes
- No Stripe Elements — Stripe Checkout hosted page keeps PCI scope minimal
- Package cards use native `<form>` POST — no client JS required for the redirect
- Webhook is the source of truth for credit updates (not success page redirect)
