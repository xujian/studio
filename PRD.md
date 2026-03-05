# Kanojo Studio — Product Requirements Document

_Last updated: 2026-03-03_

---

## Vision

**"The private photo studio that only exists in your imagination — until now."**

**Kanojo Studio** is an AI portrait photography platform built for one thing: turning imagination into emotionally resonant photographs of women.

Not a general AI image generator. Not a social platform. A private creative studio — where you arrive with a face and a feeling, and leave with a photograph that captures something real.

Other AI tools hand you a blank canvas and infinite options. Kanojo Studio gives you a fully staffed production — stylist, lighting director, set designer, photographer. You are the creative director. You decide the face, the mood, the world. The studio handles the rest.

The output isn't "AI-generated imagery." It's portrait photography.

**Target users:**
- **Women** — generating portraits of themselves for creative expression, aspiration, and content
- **Admirers** — bringing to life a face they're drawn to, imagined or real

Both arrive with the same desire: an attractive, emotionally alive portrait, created from imagination, with minimal technical effort.

**Primary jobs-to-be-done (in order):**
1. Emotional expression — "I want to see her in this mood, this world, this moment"
2. Aspiration & fantasy — "I want a more idealized, editorial version of her"
3. Content creation — "I need beautiful portrait content"

Every feature decision asks: _does this close the gap between imagination and photograph?_

---

## What This Product Is (And Isn't)

| This product | Not this product |
|---|---|
| Portrait photography powered by AI | General-purpose image generation |
| Emotion-first, curated creative space | Infinite prompting canvas |
| Lifestyle photos of women, with feeling | Any subject, any genre, any style |
| A private studio you visit with intention | A utility tool you use occasionally |
| Results that feel *captured* | Results that feel *rendered* |

---

## Scope Constraints

1. Female subjects only — no men, pets, or illustration styles
2. Aspect ratio: 9:16 (portrait) only — intentional, signals focus
3. Face is optional — system provides a default when none is chosen

---

## Distinctive Features

These five features define Kanojo Studio's identity — what makes this product irreplaceable.

### 1. Looks

A **Look** is a complete aesthetic direction: hair, outfit, makeup, scene, lighting, and camera style chosen to work as a unified whole. Not individual assets to assemble — an editorial package to inhabit.

Users browse Looks by aesthetic identity (*Dark Romance, Soft Autumn, Coastal Summer, Tokyo Night*) rather than by component category. One tap sets the entire visual direction.

Looks replace the assembly problem with a curation problem. Easier to choose, more coherent in output.

---

### 2. Vibe Transfer

Upload any photograph with an aesthetic you love. The system extracts its complete visual atmosphere — color temperature, light quality, mood, setting, season, energy — and applies it to a new portrait with your chosen face.

The most powerful form of minimal input: show, don't describe.

---

### 3. Scene Worlds

Complete narrative environments, not backdrop assets. A Scene World defines setting, lighting, time of day, and implied story:

*"Rainy afternoon in a Parisian café"*, *"Golden hour by the sea"*, *"Late night city after rain"*, *"Sunlit bedroom, early morning"*

The subject is placed *inside* a world — not positioned in front of a backdrop.

---

### 4. Mood

Emotion-first input. Before choosing specifics, the user sets the feeling of the shoot:

- **Mood presets** — *Soft & Dreamy / Bold & Confident / Melancholic / Warm & Playful / Mysterious / Carefree*
- **Free text** — *"the feeling of a new city"*, *"peaceful Sunday"*, *"summer ending"*

Both modes are the same feature — the preset is the shortcut, the text field is for when no preset fits. The chosen mood becomes the emotional brief that all other choices respond to.

This makes emotionally resonant photography a first-class interaction, not a lucky accident.

---

### 5. The Shoot

A shoot produces a coherent set of related portraits — different expressions, angles, or small variations from the same creative direction. Not one lucky frame, but a curated session.

The output feels like something was *captured*, not something that was *generated*.

Shoots are saved as a unit in Moments — the complete visual record of one session.

---

## Core Modules

These modules form the operational foundation of the product.

### Studio

The creative workspace. Users select a face, choose a Look or individual mixins, set a Direction, and shoot. The UI feels like a director's mood board — not a settings panel.

- **Face selector** — pick from your collected faces (the anchor identity)
- **Look picker** — or assemble individual mixins: outfit, hair, makeup, scene, lighting, camera
- **Mood** — preset emotional tone + optional free text
- **Reference image** — optional upload to guide pose or composition
- **Vibe Transfer** — optional upload to extract and apply an atmosphere
- **Shoot** — produces a portrait set, saved as a Moment

---

### Moments

Every shoot is saved as a Moment — capturing the face, Look, Direction, and any reference used.

- **View the full shoot** — all portraits from one session together
- **Revisit & reshoot** — reopen any Moment, adjust, shoot again
- **Private by default** — no sharing pressure

---

### Store

Where users discover and acquire Looks, faces, and individual mixin assets.

- **Browse by Look, category, or mood**
- **Free & paid** — many assets are free to lower the barrier to entry
- **Acquire** — spend credits to add to your collection instantly
- **Platform-curated + creator-submitted** — (later) community can publish assets

The Store is the primary discovery surface — new Looks = reason to come back.

**Asset visibility rules:**

| Condition | Category | Behavior |
|-----------|----------|----------|
| `is_public = true AND price IS NULL` | Official asset | Free for all users. Available in Studio without purchasing. Never shown in Store. |
| `price IS NOT NULL` (even `price = 0`) | Store asset | Listed in the Store. Must be purchased (even if free) to add to library. |
| `is_public = false AND price IS NULL` | Personal asset | Private to the owner. Not visible to others. |

---

### Credits & Subscriptions

Designed to feel generous, not punishing.

- **Free tier** — limited monthly credits, can acquire free Store assets, browse everything
- **Basic / Pro / Max subscriptions** — monthly credit allowance, scales with tier
- **Credit packs** — one-time purchases to burst beyond allowance
- **Free assets** — always free, no credits required

The goal: free users feel the value before hitting a wall, not the wall before the value.

**Monetization touchpoints:**
- Hit credit limit → subscribe or buy a credit pack
- Want a premium Look or face → spend credits in Store
- Discover assets in Community → acquire them

---

### Community (Minimal MVP)

A public inspiration wall — showing what's possible with the product.

- **Feed of public portraits** — opt-in, users choose to share a shoot
- **No social graph** — no follows, comments, or likes for now
- **Asset discovery** — tapping a portrait shows which Look + face was used, with a path to acquire them

Community is a marketing surface disguised as a feature — showcases output quality and funnels viewers into the Store.

---

## The Studio Loop

Every surface feeds the next:

```
Store → discover and acquire Looks + faces
  ↓
Studio → set Mood → shoot (costs credits)
  ↓
Moments → revisit, iterate, perfect
  ↓
Community → share a shoot (optional)
  ↓
Viewers discover the Look used → back to Store
```

**The flywheel:**
Better Looks in Store → more expressive shoots → more sharing → more discovery → more users → more creators submit Looks → better Store

---

## Design Principles

- **Emotion before configuration** — mood and feeling precede technical choices
- **Curated, not infinite** — opinionated choices that work, not endless options that overwhelm
- **Results that feel captured** — photography vocabulary throughout: shoot, direction, moment, look
- **Private and intimate** — no sharing pressure, no social performance
- **Dark mode** default with optional light mode
- **Mobile-first** — responsive across all devices
- **Premium aesthetic** — soft, curated, feminine-leaning but not exclusionary
- **Accessibility** — proper contrast, keyboard navigation, ARIA labels

---

## Landing Page

See `LANDING.md`.
