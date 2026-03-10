# Landing Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a scroll landing page for guest users at `/` with hero mosaic, how it works, features, pricing, and community sections.

**Architecture:** `app/page.tsx` becomes a Server Component that checks auth (redirects logged-in users to `/studio`) and renders five landing sections as separate components under `components/landing/`. The Google OAuth CTA is the only client component needed.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS 4, Shadcn UI (`<Card>`), Lucide React, existing Supabase server client, existing `SUBSCRIPTION_PLANS` constants.

---

## Key Facts

- **Header:** Already renders as empty `<header>` for guests (`!user` early return in `components/header.tsx`) — no nav shown for guests
- **Main wrapper:** `container mx-auto pt-24` in root layout — sections needing full-bleed use `w-screen relative left-1/2 -translate-x-1/2`
- **Pricing data:** `SUBSCRIPTION_PLANS` in `lib/constants.ts` — server-only (has Stripe IDs). Extract only `id`, `label`, `price`, `credits`, `description`, `popular` for display.
- **Auth check:** Use `createClient()` from `lib/supabase/server.ts` + `supabase.auth.getSession()`
- **Google OAuth:** Copy pattern from `app/login/page.tsx`
- **Portrait placeholders:** Use `<img>` tags with `https://picsum.photos/seed/{n}/400/711` (9:16 ratio) — swap with real portraits later

---

## Task 1: Convert `app/page.tsx` to guest landing page

**Files:**
- Modify: `app/page.tsx`

**Step 1: Replace redirect-only page with server component**

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Hero } from '@/components/landing/hero'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Features } from '@/components/landing/features'
import { Pricing } from '@/components/landing/pricing'
import { CommunityShowcase } from '@/components/landing/community-showcase'

export default async function Home() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (session) redirect('/studio')

  return (
    <div className="flex flex-col gap-24 pb-24">
      <Hero />
      <HowItWorks />
      <Features />
      <Pricing />
      <CommunityShowcase />
    </div>
  )
}
```

**Step 2: Verify dev server shows no redirect for guests**

Run: `pnpm dev` → open `http://localhost:3000` in incognito → confirm page renders (will show import errors for now, that's fine)

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: convert home page to guest landing page with auth redirect"
```

---

## Task 2: Google OAuth CTA button — client component

**Files:**
- Create: `components/landing/cta-button.tsx`

**Step 1: Create the client CTA button**

```tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export const CtaButton = ({ size = 'lg' }: { size?: 'sm' | 'lg' }) => {
  const supabase = createClient()

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
  }

  return (
    <Button onClick={handleSignIn} size={size} className="rounded-full px-8 glow-primary-hover">
      Start creating — it&apos;s free
    </Button>
  )
}
```

**Step 2: Commit**

```bash
git add components/landing/cta-button.tsx
git commit -m "feat: add landing page CTA button client component"
```

---

## Task 3: Hero section — portrait mosaic with headline

**Files:**
- Create: `components/landing/hero.tsx`

**Step 1: Create hero with full-bleed mosaic**

The mosaic uses 5 columns of portrait cards staggered vertically. Full-bleed trick: `w-screen relative left-1/2 -translate-x-1/2`.

```tsx
import { CtaButton } from './cta-button'

const PORTRAITS = [
  { seed: 'a1', offset: '0' },
  { seed: 'b2', offset: '40px' },
  { seed: 'c3', offset: '0' },
  { seed: 'd4', offset: '60px' },
  { seed: 'e5', offset: '20px' },
  { seed: 'f6', offset: '0' },
  { seed: 'g7', offset: '50px' },
  { seed: 'h8', offset: '10px' },
  { seed: 'i9', offset: '30px' },
  { seed: 'j10', offset: '0' },
]

export const Hero = () => {
  return (
    <section className="relative w-screen left-1/2 -translate-x-1/2 -mt-8 overflow-hidden h-[90vh]">
      {/* Portrait mosaic */}
      <div className="absolute inset-0 grid grid-cols-5 gap-2 p-2 scale-105">
        {PORTRAITS.map((p) => (
          <div
            key={p.seed}
            className="relative rounded-xl overflow-hidden"
            style={{ marginTop: p.offset }}
          >
            <img
              src={`https://picsum.photos/seed/${p.seed}/400/711`}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Radial gradient — lighter in center */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,transparent,rgba(0,0,0,0.4))]" />

      {/* Bottom fade to page background */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-6 text-center px-4">
        <div className="logo w-10 h-10 text-white" aria-hidden />
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
          Your personal<br />portrait studio.
        </h1>
        <p className="text-lg text-white/70 max-w-md">
          Pick a face. Set the vibe. Generate stunning 9:16 portraits in seconds.
        </p>
        <CtaButton />
      </div>
    </section>
  )
}
```

**Step 2: Verify in browser**

Open `http://localhost:3000` — hero should fill ~90vh with portrait mosaic, dark overlay, and centered text.

**Step 3: Commit**

```bash
git add components/landing/hero.tsx
git commit -m "feat: add landing hero section with portrait mosaic"
```

---

## Task 4: How It Works section — 3-step flow

**Files:**
- Create: `components/landing/how-it-works.tsx`

**Step 1: Create the section**

```tsx
import { Card, CardContent } from '@/components/ui/card'
import { ShoppingBag, Layers, Sparkles } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    icon: ShoppingBag,
    title: 'Pick a face',
    description: 'Browse the Store, claim a face you love — or upload your own. Many faces are free.',
  },
  {
    number: '02',
    icon: Layers,
    title: 'Mix your style',
    description: 'Layer Mixins on top: outfit, makeup, hair, scene, lighting. Your vision, your way.',
  },
  {
    number: '03',
    icon: Sparkles,
    title: 'Generate',
    description: 'Your 9:16 portrait is ready in seconds. Saved to your Moments, ready to iterate.',
  },
]

export const HowItWorks = () => {
  return (
    <section className="flex flex-col items-center gap-12 px-4">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          How it works
        </p>
        <h2 className="text-3xl md:text-4xl font-bold">
          Three steps to your perfect portrait.
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl relative">
        {/* Connector line (desktop only) */}
        <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-border to-transparent z-0" />

        {STEPS.map((step) => (
          <Card key={step.number} className="relative flex flex-col gap-4 p-6 glass elevation-2">
            <CardContent className="p-0 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black text-muted-foreground/30">{step.number}</span>
                <div className="icon bg-primary/10 text-primary">
                  <step.icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
```

**Step 2: Commit**

```bash
git add components/landing/how-it-works.tsx
git commit -m "feat: add How It Works landing section"
```

---

## Task 5: Feature Highlights section

**Files:**
- Create: `components/landing/features.tsx`

**Step 1: Create the section**

```tsx
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, ShoppingBag, Images } from 'lucide-react'

const FEATURES = [
  {
    icon: Sparkles,
    title: 'The Studio',
    description: 'Combine a face, Mixins, and a prompt. Generate stunning 9:16 portraits in seconds. Iterate endlessly.',
    color: 'text-violet-400 bg-violet-400/10',
  },
  {
    icon: ShoppingBag,
    title: 'The Store',
    description: 'Browse faces, outfits, scenes, and more. Many free. New drops regularly. Build your collection.',
    color: 'text-pink-400 bg-pink-400/10',
  },
  {
    icon: Images,
    title: 'Your Moments',
    description: 'Every generation saved. Revisit, tweak, and generate variations anytime. Your creative history.',
    color: 'text-sky-400 bg-sky-400/10',
  },
]

export const Features = () => {
  return (
    <section className="flex flex-col items-center gap-12 px-4">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Everything you need
        </p>
        <h2 className="text-3xl md:text-4xl font-bold">
          Built for one thing.<br />Done perfectly.
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {FEATURES.map((f) => (
          <Card key={f.title} className="flex flex-col gap-6 p-6 glass elevation-2 glow-primary-hover transition-all">
            <CardContent className="p-0 flex flex-col gap-4">
              <div className={`icon w-12 h-12 rounded-2xl ${f.color}`}>
                <f.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
```

**Step 2: Commit**

```bash
git add components/landing/features.tsx
git commit -m "feat: add Feature Highlights landing section"
```

---

## Task 6: Pricing section

**Files:**
- Create: `components/landing/pricing.tsx`

**Note:** Do NOT import `SUBSCRIPTION_PLANS` here (it references Stripe env vars and is server-only). Use a static local array for the display data.

**Step 1: Create the section**

```tsx
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { CtaButton } from './cta-button'
import { Check } from 'lucide-react'

const PLANS = [
  {
    id: 'basic',
    label: 'Basic',
    price: 9,
    credits: 100,
    description: 'For casual creators',
    features: ['100 credits / month', 'Access to Store', 'Unlimited Moments', 'Email support'],
    popular: false,
  },
  {
    id: 'pro',
    label: 'Pro',
    price: 19,
    credits: 250,
    description: 'For regular users',
    features: ['250 credits / month', 'Access to Store', 'Unlimited Moments', 'Priority generation', 'Priority support'],
    popular: true,
  },
  {
    id: 'max',
    label: 'Max',
    price: 39,
    credits: 600,
    description: 'For power users',
    features: ['600 credits / month', 'Access to Store', 'Unlimited Moments', 'Priority generation', 'Priority support'],
    popular: false,
  },
]

export const Pricing = () => {
  return (
    <section className="flex flex-col items-center gap-12 px-4">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Simple pricing
        </p>
        <h2 className="text-3xl md:text-4xl font-bold">
          Start free. Upgrade when you&apos;re ready.
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl items-center">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              'relative flex flex-col rounded-2xl border p-0 transition-all',
              plan.popular
                ? 'border-primary bg-primary/5 ring-2 ring-primary scale-105 elevation-3'
                : 'border-border bg-card'
            )}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                Most Popular
              </span>
            )}
            <CardTitle className="p-6 pb-2">{plan.label}</CardTitle>
            <CardContent className="p-6 pt-2 flex flex-col gap-4 flex-1">
              <div>
                <span className="text-4xl font-black">${plan.price}</span>
                <span className="text-muted-foreground text-sm"> / month</span>
              </div>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              <ul className="flex flex-col gap-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <CtaButton />
            </CardFooter>
          </Card>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        Free tier included — no credit card required. Credit packs available for all plans.
      </p>
    </section>
  )
}
```

**Step 2: Commit**

```bash
git add components/landing/pricing.tsx
git commit -m "feat: add Pricing landing section"
```

---

## Task 7: Community Showcase section

**Files:**
- Create: `components/landing/community-showcase.tsx`

**Step 1: Create the section**

```tsx
import { CtaButton } from './cta-button'

const SHOWCASE_PORTRAITS = [
  'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'p12',
]

export const CommunityShowcase = () => {
  return (
    <section className="flex flex-col items-center gap-12 px-4">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Made with Kanojo Studio
        </p>
        <h2 className="text-3xl md:text-4xl font-bold">
          See what&apos;s possible.
        </h2>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 gap-2 w-full max-w-4xl">
        {SHOWCASE_PORTRAITS.map((seed) => (
          <div
            key={seed}
            className="relative aspect-[9/16] rounded-xl overflow-hidden group"
          >
            <img
              src={`https://picsum.photos/seed/${seed}/400/711`}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
          </div>
        ))}
      </div>

      {/* Final CTA */}
      <div className="flex flex-col items-center gap-4 pt-8">
        <p className="text-xl font-semibold">Ready to create yours?</p>
        <CtaButton />
      </div>
    </section>
  )
}
```

**Step 2: Commit**

```bash
git add components/landing/community-showcase.tsx
git commit -m "feat: add Community Showcase landing section"
```

---

## Task 8: Final verification

**Step 1: Build check**

```bash
pnpm build
```

Expected: no type errors, no missing imports.

**Step 2: Visual check in browser**

Open `http://localhost:3000` in incognito (guest). Verify:
- [ ] Hero fills ~90vh with portrait mosaic, dark overlay, centered headline + CTA
- [ ] How It Works shows 3 steps in a row
- [ ] Feature Highlights shows 3 cards with icons
- [ ] Pricing shows 3 tiers, Pro elevated and highlighted
- [ ] Community grid shows portraits, final CTA at bottom
- [ ] Logged-in user visits `/` → redirects to `/studio`

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: landing page complete — hero, how it works, features, pricing, community"
```
