# Coding Style Guide

This document defines the coding standards for the Kanojo Studio project.

---

## Component Structure

### Component Definition
Use arrow functions for all React components:

```typescript
// ✅ Good
export const PromptForm = ({ onSubmit, isLoading }: PromptFormProps) => {
  return <form>...</form>
}

// ❌ Avoid
export default function PromptForm(props: PromptFormProps) {
  return <form>...</form>
}
```

### Exports
- **Pages/Routes**: Default exports (Next.js convention)
- **Components/Utilities**: Named exports

```typescript
// app/studio/page.tsx
export default function StudioPage() { ... }

// components/prompt-form.tsx
export const PromptForm = ({ ... }) => { ... }

// lib/utils.ts
export const formatDate = (date: Date) => { ... }
```

---

## TypeScript

### Strict Mode
Project uses TypeScript strict mode. All type checks enabled.

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### Props Definition
Define props inline with destructuring:

```typescript
// ✅ Good
type ButtonProps = {
  label: string
  onClick: () => void
  disabled?: boolean
}

export const Button = ({ label, onClick, disabled = false }: ButtonProps) => {
  return <button onClick={onClick} disabled={disabled}>{label}</button>
}

// ❌ Avoid
export const Button = (props: ButtonProps) => {
  return <button onClick={props.onClick}>{props.label}</button>
}
```

---

## File Structure

### File Naming
Use kebab-case for all files:

```
✅ Good:
  prompt-form.tsx
  use-generations.ts
  image-display.tsx

❌ Avoid:
  PromptForm.tsx
  useGenerations.ts
  ImageDisplay.tsx
```

### File Organization
Structure files in this order:

```typescript
// 1. Imports (auto-sorted)
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

// 2. Types and Interfaces
type PromptFormProps = {
  onSubmit: (data: FormData) => void
  isLoading: boolean
}

// 3. Component
export const PromptForm = ({ onSubmit, isLoading }: PromptFormProps) => {
  // Component logic
  return <form>...</form>
}

// 4. Helper functions (if needed)
const formatPrompt = (text: string) => { ... }
```

---

## Formatting

### Code Style
- **Quotes**: Single quotes (`'`)
- **Semicolons**: None (rely on ASI)
- **Line length**: Prefer 80-100 characters
- **Trailing commas**: Yes (for multi-line)

```typescript
// ✅ Good
const user = {
  name: 'John',
  email: 'john@example.com',
}

const handleClick = () => {
  console.log('clicked')
}

// ❌ Avoid
const user = {
  name: "John",
  email: "john@example.com"
};

const handleClick = () => {
  console.log("clicked");
};
```

### Import Organization
Auto-sort imports in this order:
1. React/Next.js
2. External libraries
3. Internal modules (@ alias)
4. Relative imports
5. Types (import type)

```typescript
// ✅ Good
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { PromptForm } from './prompt-form'
import type { Generation } from '@/lib/types'

// ❌ Avoid (mixed order)
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import type { Generation } from '@/lib/types'
import { useQuery } from '@tanstack/react-query'
```

---

## Async Operations

### Prefer async/await
Use async/await over promise chains:

```typescript
// ✅ Good
const handleSubmit = async (data: FormData) => {
  try {
    const result = await generateImage(data.prompt)
    setImage(result)
  } catch (error) {
    setError(error.message)
  }
}

// ❌ Avoid
const handleSubmit = (data: FormData) => {
  generateImage(data.prompt)
    .then(result => setImage(result))
    .catch(error => setError(error.message))
}
```

---

## Styling

### Tailwind Utility-First
Use Tailwind classes directly in components:

```typescript
// ✅ Good
export const Card = ({ children }: CardProps) => {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      {children}
    </div>
  )
}

// Use cn() for conditional classes
export const Button = ({ variant, children }: ButtonProps) => {
  return (
    <button
      className={cn(
        'rounded px-4 py-2',
        variant === 'primary' && 'bg-primary text-white',
        variant === 'secondary' && 'bg-secondary text-foreground'
      )}
    >
      {children}
    </button>
  )
}
```

---

## Comments

### Minimal Comments
Prefer self-documenting code. Add comments only for:
- Complex business logic
- Non-obvious workarounds
- Important caveats

```typescript
// ✅ Good - Clear without comments
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US').format(date)
}

// ✅ Good - Comment explains why
const generateImage = async (prompt: string) => {
  // Gemini requires prompts to be prefixed with generation context
  const enhancedPrompt = `Generate a high-quality portrait: ${prompt}`
  return await genAI.generateContent(enhancedPrompt)
}

// ❌ Avoid - Redundant comments
// This function formats a date
const formatDate = (date: Date) => {
  // Convert date to string using Intl API
  return new Intl.DateTimeFormat('en-US').format(date)
}
```

---

## Best Practices

### Component Size
Keep components small and focused. If a component exceeds 150 lines, consider splitting.

### DRY (Don't Repeat Yourself)
Extract repeated logic into hooks or utilities.

### YAGNI (You Aren't Gonna Need It)
Don't add features or abstractions until needed.

### Server vs Client Components
- Default to Server Components
- Only use 'use client' when needed:
  - Event handlers
  - Browser APIs
  - React hooks (useState, useEffect)
  - Context consumers

```typescript
// Server Component (default)
export default async function GalleryPage() {
  const generations = await getGenerations()
  return <GalleryGrid generations={generations} />
}

// Client Component (needs interactivity)
'use client'

export const GalleryGrid = ({ generations }: Props) => {
  const [selected, setSelected] = useState(null)
  return <div onClick={() => setSelected(id)}>...</div>
}
```

---

## Tools

### ESLint
Configure ESLint with recommended rules:
- React/Next.js rules
- TypeScript strict
- Import sorting

### Prettier
Use Prettier with these settings:
- Single quotes
- No semicolons
- Trailing commas: es5
- Print width: 100

---

## Git Commits

### Commit Messages
Follow conventional commits format:

```
feat: add user authentication
fix: resolve image upload error
docs: update README setup instructions
refactor: simplify generation API route
style: format code with prettier
test: add tests for prompt validation
```

Include co-author in all commits:
```
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Examples

### Complete Component Example

```typescript
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { Generation } from '@/lib/types'

type GenerationCardProps = {
  generation: Generation
  onDelete: (id: string) => void
}

export const GenerationCard = ({ generation, onDelete }: GenerationCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('Are you sure?')) return

    setIsDeleting(true)
    try {
      await onDelete(generation.id)
    } catch (error) {
      console.error('Delete failed:', error)
      setIsDeleting(false)
    }
  }

  const handleRegenerate = () => {
    router.push(`/studio?prompt=${encodeURIComponent(generation.prompt)}`)
  }

  return (
    <div className="group relative overflow-hidden rounded-lg border">
      <img
        src={generation.url}
        alt={generation.prompt}
        className="aspect-square object-cover"
      />

      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 p-4 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex w-full gap-2">
          <Button onClick={handleRegenerate} size="sm" variant="secondary">
            Regenerate
          </Button>
          <Button
            onClick={handleDelete}
            size="sm"
            variant="destructive"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## Enforcement

Configure tooling to enforce these styles automatically:
- ESLint for code quality
- Prettier for formatting
- TypeScript strict mode for type safety
- Pre-commit hooks to validate

This ensures consistency without manual review.
