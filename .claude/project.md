---
name: Kanojo Studio project context
description: Ground truth about what this project is, current focus, and key context for every session
type: project
---

## What It Is

AI-powered portrait photography platform — **Kanojo Studio**, currently in MVP/pre-public-launch phase. Users generate AI portrait photos using Google Gemini with a face asset + style controls system.

**Why:** Building toward a paid marketplace where users can purchase curated "looks" (assets) to apply to their portraits. Credits system powers both generation and asset purchases.

**How to apply:** Frame all suggestions in the context of a pre-launch product. Prioritize shipping over perfection. Avoid over-engineering.

---

## Current Focus Areas

- Stripe billing integration (credits + subscriptions)
- Asset marketplace (buying/selling looks)
- Google One Tap auth (FedCM-compatible)
- Landing page SEO

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack, `proxy.ts` middleware pattern)
- **Backend:** Supabase (auth + Postgres + storage)
- **AI:** Google Gemini API (image generation + vision analysis)
- **Data fetching:** TanStack Query (all client hooks in `/hooks/`)
- **UI:** Tailwind CSS + Shadcn UI
- **Forms:** React Hook Form + Zod validation
- **Package manager:** pnpm

---

## Dev Server

- Runs HTTPS on **port 443** at `https://kanojostudio.io`
- Requires certs in repo root: `kanojostudio.io.pem` + `kanojostudio.io-key.pem` (gitignored)
- Local DNS: `127.0.0.1 kanojostudio.io` must be in `/etc/hosts`
- OAuth redirect must be `https://kanojostudio.io/auth/callback`
- May need `sudo pnpm dev` to bind port 443

---

## Key Docs

- `docs/CODING_STYLE.md` — authoritative style guide
- `docs/ASSET.md` — asset system design
- `docs/MIXIN.md` — mixin/asset selection types
- `docs/OPEN_QUESTIONS.md` — 3 launch-blocking decisions
- `docs/plans/` — feature design docs + implementation plans

---

## Open Questions (launch blockers)

See `docs/OPEN_QUESTIONS.md` for detail on:
1. Content policy — affects what can be generated/shared
2. Look curation pipeline — affects asset marketplace design
3. First-shoot onboarding — affects studio UX and API

Check before implementing features in these areas.
