# Magazine Layout Blocks Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Kinfolk-inspired MDX layout components (ImageText, ImagePair, InsetImage, PullQuote) for the magazine article page.

**Architecture:** The article page container expands to `max-w-5xl`; raw prose elements (p, h1, etc.) are CSS-constrained back to `max-w-2xl` centered within it. Custom MDX components render as full-width divs and naturally escape the prose constraint, allowing editorial two-column and full-width layouts.

**Tech Stack:** Next.js App Router, MDX via next-mdx-remote/rsc, Tailwind CSS, TypeScript

---

### Task 1: Widen article container + constrain prose via CSS

**Files:**
- Modify: `app/magazine/[slug]/page.tsx`
- Modify: `styles/utilities.css`

**Step 1: Update article page container from `max-w-2xl` to `max-w-5xl`**

In `app/magazine/[slug]/page.tsx`, change the body section:

```tsx
{/* Body */}
<div className="mx-auto max-w-5xl px-6 pb-24">
  <div className="prose-article">
    <MDXRemote source={post.content} components={mdxComponents} />
  </div>
</div>
```

Also narrow the header to stay centered:
```tsx
{/* Header stays max-w-2xl */}
<div className="mx-auto max-w-2xl px-6 pt-14 pb-10 text-center">
```

**Step 2: Add prose constraint CSS to `styles/utilities.css`**

Replace the existing `prose-article` block with:

```css
/* Magazine article prose — constrain raw elements, let custom blocks break out */
.prose-article > p,
.prose-article > h1,
.prose-article > h2,
.prose-article > h3,
.prose-article > ul,
.prose-article > ol,
.prose-article > blockquote,
.prose-article > hr {
  max-width: 42rem;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

.prose-article > p:first-of-type::first-letter {
  font-family: var(--font-playfair), Georgia, serif;
  float: left;
  font-size: 4.5rem;
  line-height: 0.8;
  padding-right: 0.12em;
  padding-top: 0.06em;
  font-weight: 700;
}
```

**Step 3: Verify dev server renders article with same look (prose still centered)**

Run: `pnpm dev` and visit `/magazine/nothing-on-her-face`

---

### Task 2: Create `ImageText` component

**Files:**
- Create: `components/magazine/image-text.tsx`

**Step 1: Write the component**

```tsx
// Left: portrait image with caption
// Right: prose children (paragraphs passed as MDX children)

type Props = {
  src: string
  caption?: string
  children: React.ReactNode
}

export function ImageText({ src, caption, children }: Props) {
  return (
    <div className="grid grid-cols-[2fr_3fr] gap-10 my-14 items-start">
      <figure className="sticky top-8">
        <img src={src} alt={caption ?? ''} className="w-full object-cover" />
        {caption && (
          <figcaption className="mt-2 text-xs tracking-wide text-muted-foreground italic">
            {caption}
          </figcaption>
        )}
      </figure>
      <div>{children}</div>
    </div>
  )
}
```

---

### Task 3: Create `ImagePair` component

**Files:**
- Create: `components/magazine/image-pair.tsx`

**Step 1: Write the component**

The props come as MDX attributes — keep them flat strings, not objects.

```tsx
type Props = {
  leftSrc: string
  leftCaption?: string
  rightSrc: string
  rightCaption?: string
}

export function ImagePair({ leftSrc, leftCaption, rightSrc, rightCaption }: Props) {
  return (
    <div className="grid grid-cols-2 gap-6 my-14">
      <figure>
        <img src={leftSrc} alt={leftCaption ?? ''} className="w-full object-cover" />
        {leftCaption && (
          <figcaption className="mt-2 text-xs tracking-wide text-muted-foreground italic">
            {leftCaption}
          </figcaption>
        )}
      </figure>
      <figure>
        <img src={rightSrc} alt={rightCaption ?? ''} className="w-full object-cover" />
        {rightCaption && (
          <figcaption className="mt-2 text-xs tracking-wide text-muted-foreground italic">
            {rightCaption}
          </figcaption>
        )}
      </figure>
    </div>
  )
}
```

---

### Task 4: Create `InsetImage` component

**Files:**
- Create: `components/magazine/inset-image.tsx`

**Step 1: Write the component**

Floats within the prose column (itself constrained to `max-w-2xl`):

```tsx
type Props = {
  src: string
  caption?: string
  side?: 'left' | 'right'
}

export function InsetImage({ src, caption, side = 'right' }: Props) {
  return (
    <figure
      className={[
        'my-4 w-2/5',
        side === 'right' ? 'float-right ml-8 mb-4' : 'float-left mr-8 mb-4',
      ].join(' ')}
    >
      <img src={src} alt={caption ?? ''} className="w-full object-cover" />
      {caption && (
        <figcaption className="mt-2 text-xs tracking-wide text-muted-foreground italic">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
```

---

### Task 5: Create `PullQuote` component

**Files:**
- Create: `components/magazine/pull-quote.tsx`

**Step 1: Write the component**

```tsx
type Props = {
  children: React.ReactNode
}

export function PullQuote({ children }: Props) {
  return (
    <blockquote className="my-12 mx-auto max-w-2xl px-6 py-8 border-y border-foreground/15 text-center">
      <p className="font-playfair text-2xl italic leading-relaxed text-foreground/80">
        {children}
      </p>
    </blockquote>
  )
}
```

---

### Task 6: Register all components in `mdx-components.tsx`

**Files:**
- Modify: `components/mdx-components.tsx`

**Step 1: Import and add to the components map**

Add imports at the top:
```tsx
import { ImageText } from './magazine/image-text'
import { ImagePair } from './magazine/image-pair'
import { InsetImage } from './magazine/inset-image'
import { PullQuote } from './magazine/pull-quote'
```

Add to `mdxComponents`:
```tsx
ImageText,
ImagePair,
InsetImage,
PullQuote,
```

Also update the type to accept these (the current type is too narrow — widen it):
```tsx
// Replace the current MdxComponents type with:
import type { MDXComponents } from 'mdx/types'
export const mdxComponents: MDXComponents = { ... }
```

---

### Task 7: Update sample article to demonstrate the components

**Files:**
- Modify: `content/magazine/2026-03-08-nothing-on-her-face.mdx`

**Step 1: Add an `ImageText` block around the Avedon section**

Replace the inline `![...]` image with an `ImageText` component that wraps the Avedon + ma paragraphs:

```mdx
<ImageText
  src="https://images.unsplash.com/photo-1673449265345-634b60689388?auto=format&fit=crop&w=900&q=85"
  caption="A face looking upward — expression held at the threshold."
>

Photographers have understood this instinctively...

There is a Japanese concept, *ma*...

</ImageText>
```

**Step 2: Add a `PullQuote` before the closing paragraphs**

```mdx
<PullQuote>
  The image becomes a collaboration between the subject and the person looking.
</PullQuote>
```

---

### Task 8: Commit

```bash
git add components/magazine/ components/mdx-components.tsx app/magazine/[slug]/page.tsx styles/utilities.css content/magazine/2026-03-08-nothing-on-her-face.mdx
git commit -m "feat: add Kinfolk-inspired magazine layout blocks (ImageText, ImagePair, InsetImage, PullQuote)"
```
