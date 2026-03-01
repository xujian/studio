# Kanojo Studio — Product Requirements Document

_Last updated: 2026-03-01_

---

## Vision

**"Your personal portrait studio."**

**Kanojo Studio** is an AI portrait photography app focused on young women — generating beautiful, realistic portraits in a curated, opinionated creative space. Not a general AI tool. Not a social network. A focused experience built around faces, style, and self-expression. The 9:16 portrait format is a feature, not a constraint — it signals intentionality.

**Target users:**
- **Young women** — generating portraits of themselves for expression, aspiration, and content
- **Male fans/partners** — generating portraits of a face they're drawn to ("their Kanojo")

The emotional tone should feel closer to a high-end beauty app than a tech tool. Soft, curated, feminine-leaning aesthetic — but not exclusionary.

**Primary jobs-to-be-done (in order):**
1. Creative expression — "I want to imagine myself in different styles, outfits, scenarios"
2. Aspiration/fantasy — "I want to see a more idealized or editorial version of myself"
3. Content creation — "I need beautiful portrait content for social media, profiles, etc."

Every feature decision should ask: _does this make her feel more in control and more creative?_

---

## Scope Constraints

1. Only generate realistic photos of female subjects — no men, pets, or anime
2. Aspect ratio: 9:16 (portrait) only
3. Face is optional — if not provided, system uses a default face

---

## The Full Loop

Every surface feeds the next:

```
Store → acquire face + mixins
  ↓
Studio → generate portrait (costs credits)
  ↓
Moments → revisit, iterate, perfect
  ↓
Community → share a portrait (optional)
  ↓
Viewers discover assets used → back to Store
```

**The flywheel:**
Better assets in Store → better generations → more sharing → more discovery → more users → more creators submit assets → better Store

---

## Core Features

### 1. The Studio (Generation)

The creative workspace — where a user directs her portrait shoot. The UI should feel like a creative director's mood board, not a settings panel.

- **Face selector** — pick from your collected faces (the anchor)
- **Mixins** — stack acquired assets: outfit, makeup, hair, scene, lighting, camera
- **Text prompt** — optional natural language to describe mood or details
- **Reference image** — optional upload to guide pose or composition
- **Generate** — produces a 9:16 portrait, saved to Moments

---

### 2. Moments (Your Gallery)

Every generation is saved as a Moment — capturing the face, mixins, and prompt used.

- **Variations** — generate multiple portraits within one Moment (same baseline, small tweaks)
- **Revisit & regenerate** — reopen any Moment, adjust mixins, generate new variations
- **Private by default** — no sharing pressure

---

### 3. The Store

Where users discover and acquire assets — faces, outfits, makeup, hair, scenes, lighting, camera styles.

- **Browse by category** — filter by asset type
- **Free & paid** — many assets are free to lower the barrier to entry
- **Acquire** — spend credits to add to your collection instantly
- **Platform-curated + creator-submitted** — (later) community can publish assets

The Store is the primary discovery surface — new assets = reason to come back.

**Asset visibility rules:**

| Condition | Category | Behavior |
|-----------|----------|----------|
| `is_public = true AND price IS NULL` | Official asset | Free for all users. Available in Studio without purchasing. Never shown in Store. |
| `price IS NOT NULL` (even `price = 0`) | Store asset | Listed in the Store. Must be purchased (even if free) to add to library. |
| `is_public = false AND price IS NULL` | Personal asset | Private to the owner. Not visible to others. |

---

### 4. Credits & Subscriptions

Designed to feel generous, not punishing.

- **Free tier** — limited monthly credits, can acquire free Store assets, browse everything
- **Basic / Pro / Max subscriptions** — monthly credit allowance, scales with tier
- **Credit packs** — one-time purchases to burst beyond allowance
- **Free assets** — always free, no credits required

The goal: free users feel the value before hitting a wall, not the wall before the value.

**Monetization touchpoints:**
- Hit credit limit → subscribe or buy a credit pack
- Want a premium face or mixin → spend credits in Store
- Discover assets in Community → acquire them

---

### 5. Community (Minimal MVP)

A public inspiration wall — showing what's possible with the tool.

- **Feed of public portraits** — opt-in, users choose to share a generation
- **No social graph** — no follows, comments, or likes for now
- **Asset discovery** — tapping a portrait shows which face + mixins were used, with a path to acquire them

Community is a marketing surface disguised as a feature — showcases output quality and funnels viewers into the Store.

---

## Design Principles

- **Dark mode** default with optional light mode
- **Mobile-first** — responsive across all devices
- **Premium feel** — glassmorphism, smooth animations, micro-interactions
- **Accessibility** — proper contrast, keyboard navigation, ARIA labels
