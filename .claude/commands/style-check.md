Audit the file `$ARGUMENTS` against the coding style rules in `docs/CODING_STYLE.md`.

Check for violations in these categories:

**General style:**
- File name is kebab-case
- Arrow functions used (not `function` declarations) for components and hooks
- No semicolons
- Single quotes (not double quotes)
- Trailing commas in multi-line arrays/objects/params
- Import order: React/Next → external → `@/` internal → relative → `import type` last

**TypeScript:**
- Props defined as `type` (not `interface`)
- Props destructured in function signature (not accessed via `props.foo`)
- No inline type definitions that duplicate types from `lib/types.ts`

**Project-specific:**
- Any component using hooks from `/hooks/` has `'use client'` directive
- Correct Supabase client imported for the file's context (browser client in Client Components, server client in API routes/Server Components)
- `assets.path` is never used directly as an image `src` without `getPublicUrl()`
- Photo fields are always merged with moment baseline before use

**Output format:**
- List each violation with: line number, rule violated, suggested fix
- If no violations: print "style-compliant ✓"
