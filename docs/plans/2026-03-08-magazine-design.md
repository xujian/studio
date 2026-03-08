# Magazine (Blog) System Design

**Date:** 2026-03-08
**Status:** Approved

## Overview

Official editorial magazine for Kanojo Studio. Staff-written posts only (no user content). Content managed as MDX files in the repository — no CMS, no database.

## File Structure

```
/content
  /magazine
    YYYY-MM-DD-slug-title.mdx

/app
  /magazine
    page.tsx           ← post list (Server Component)
    /[slug]
      page.tsx         ← single post (Server Component)

/lib
  magazine.ts          ← all content reading functions
```

## MDX Frontmatter Schema

```mdx
---
title: Welcome to Kanojo Studio
date: 2026-03-08
excerpt: A short summary shown in the post list.
coverImage: /blog/welcome.jpg   # optional
published: true
---
```

- `published: false` drafts are skipped at build time
- Filename slug = URL slug

## Data Layer (`lib/magazine.ts`)

Three server-only functions:

```ts
getAllPosts(): PostMeta[]       // all published posts, newest first
getPostBySlug(slug): Post | null  // metadata + raw MDX content
getAllSlugs(): string[]         // for generateStaticParams
```

### Types

```ts
type PostMeta = {
  slug: string
  title: string
  date: string
  excerpt: string
  coverImage?: string
}

type Post = PostMeta & {
  content: string  // raw MDX string
}
```

## Pages

### Post List — `app/magazine/page.tsx`
- Server Component
- Calls `getAllPosts()` directly
- Renders grid of post cards (cover image, title, date, excerpt)

### Single Post — `app/magazine/[slug]/page.tsx`
- Server Component
- `generateStaticParams()` → fully static at build time
- `generateMetadata()` → per-post `<title>` and OG tags
- Renders MDX via `next-mdx-remote/rsc`

### Custom MDX Components
Styled wrappers passed to the renderer:
- `h1`, `h2`, `h3` — styled headings
- `p` — body text with proper line height
- `img` — `next/image` with optimization
- `a` — styled links
- `code`, `pre` — syntax-highlighted code blocks

## Libraries

- `gray-matter` — parse MDX frontmatter
- `next-mdx-remote` — render MDX in App Router (use `/rsc` import)

## Navigation

Add "Magazine" link to main nav in `app/layout.tsx`.

## Publishing Workflow

Write `.mdx` file → commit → push → CI builds → deploy. Weekly cadence is acceptable.
