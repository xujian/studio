# Axiom Logging Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate Axiom logging into the image generation flow to trace Gemini API calls, capture errors, and record successful generations.

**Architecture:** Use `@axiomhq/nextjs` official SDK. Create a `lib/axiom/` module with a singleton client, server logger, and client logger. Wrap the `/api/photo` route with `withAxiom` for automatic error/success reporting. Add manual `logger.info/error` calls around the Gemini API call in `lib/engine.ts` with latency timing. Update `proxy.ts` to log all incoming requests.

**Tech Stack:** `@axiomhq/js`, `@axiomhq/logging`, `@axiomhq/nextjs`, `@axiomhq/react`, Next.js 16 App Router, TypeScript.

---

## Prerequisites

Before starting, complete these manual steps:

1. Create an account at axiom.co
2. Create a dataset named `service`
3. Go to Settings → API Tokens → create a token with **Ingest** permission only
4. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_AXIOM_TOKEN=your-token-here
   NEXT_PUBLIC_AXIOM_DATASET=service
   ```
5. Add the same vars to `docker-compose.yml` under `services.app.environment`

---

### Task 1: Install packages

**Files:**
- Modify: `package.json` (via pnpm)

**Step 1: Install Axiom packages**

```bash
pnpm add @axiomhq/js @axiomhq/logging @axiomhq/nextjs @axiomhq/react
```

**Step 2: Verify installation**

```bash
pnpm list | grep axiomhq
```

Expected output: four `@axiomhq/*` packages listed.

---

### Task 2: Create Axiom client singleton

**Files:**
- Create: `lib/axiom/axiom.ts`

**Step 1: Create the file**

```ts
// lib/axiom/axiom.ts
import { Axiom } from '@axiomhq/js'

const axiomClient = new Axiom({
  token: process.env.NEXT_PUBLIC_AXIOM_TOKEN!,
})

export default axiomClient
```

**Step 2: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | head -30
```

Expected: no type errors on the new file.

---

### Task 3: Create server logger + route wrapper

**Files:**
- Create: `lib/axiom/server.ts`

**Step 1: Create the file**

```ts
// lib/axiom/server.ts
import axiomClient from '@/lib/axiom/axiom'
import { Logger, AxiomJSTransport } from '@axiomhq/logging'
import { createAxiomRouteHandler, nextJsFormatters } from '@axiomhq/nextjs'

export const logger = new Logger({
  transports: [
    new AxiomJSTransport({
      axiom: axiomClient,
      dataset: process.env.NEXT_PUBLIC_AXIOM_DATASET!,
    }),
  ],
  formatters: nextJsFormatters,
})

export const withAxiom = createAxiomRouteHandler(logger)
```

**Step 2: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | head -30
```

Expected: no errors.

---

### Task 4: Create client logger

**Files:**
- Create: `lib/axiom/client.ts`

**Step 1: Create the file**

```ts
// lib/axiom/client.ts
'use client'
import axiomClient from '@/lib/axiom/axiom'
import { Logger, AxiomJSTransport } from '@axiomhq/logging'
import { createUseLogger, createWebVitalsComponent } from '@axiomhq/react'
import { nextJsFormatters } from '@axiomhq/nextjs/client'

export const logger = new Logger({
  transports: [
    new AxiomJSTransport({
      axiom: axiomClient,
      dataset: process.env.NEXT_PUBLIC_AXIOM_DATASET!,
    }),
  ],
  formatters: nextJsFormatters,
})

export const useLogger = createUseLogger(logger)
export const WebVitals = createWebVitalsComponent(logger)
```

**Step 2: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | head -30
```

Expected: no errors.

---

### Task 5: Update proxy.ts to log all requests

**Files:**
- Modify: `proxy.ts`

**Context:** `proxy.ts` is the Next.js 16 replacement for `middleware.ts`. It runs on every request. We add Axiom request logging here so every page visit is captured.

**Step 1: Read current file**

Current `proxy.ts`:
```ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/auth/callback')) {
    return
  }
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}
```

**Step 2: Update the file**

```ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'
import { logger } from '@/lib/axiom/server'
import { transformMiddlewareRequest } from '@axiomhq/nextjs'

export async function proxy(request: NextRequest) {
  // Log incoming request to Axiom
  logger.info(...transformMiddlewareRequest(request))

  if (request.nextUrl.pathname.startsWith('/auth/callback')) {
    await logger.flush()
    return
  }

  const response = await updateSession(request)
  await logger.flush()
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}
```

**Step 3: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | head -30
```

Expected: no errors.

---

### Task 6: Add Gemini logging to engine.ts

**Files:**
- Modify: `lib/engine.ts`

**Context:** The engine's `generate()` function calls Gemini at line 88. We need to:
- Add `requestId` to `GenerateParams` for log correlation
- Record latency and result of the Gemini call
- Log errors before re-throwing

**Step 1: Add `requestId` to `GenerateParams` interface**

Find (line 12-17):
```ts
export interface GenerateParams {
  userId: string
  prompt: string
  assets?: Assets
  reference?: string
}
```

Replace with:
```ts
export interface GenerateParams {
  userId: string
  prompt: string
  assets?: Assets
  reference?: string
  requestId: string
}
```

**Step 2: Destructure `requestId` in generate()**

Find (line 44-49):
```ts
  generate: async ({
    userId,
    prompt,
    assets,
    reference
  }: GenerateParams): Promise<GenerateResult> => {
```

Replace with:
```ts
  generate: async ({
    userId,
    prompt,
    assets,
    reference,
    requestId
  }: GenerateParams): Promise<GenerateResult> => {
```

**Step 3: Add import for logger**

Add at top of file after existing imports:
```ts
import { logger } from './axiom/server'
```

**Step 4: Wrap the Gemini call with logging**

Find (line 86-100):
```ts
    console.log('============================BEFORE GENERATE=====prompt:', json, parts)
    // 4. Generate
    const response = await ai.models.generateContent({
      model: process.env.NANO_BANANA_MODEL!,
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: '9:16',
          imageSize: '2K'
        }
      }
    })
    return extractGenerationResult(response)
```

Replace with:
```ts
    // 4. Generate
    const geminiStart = Date.now()
    let response: any
    try {
      response = await ai.models.generateContent({
        model: process.env.NANO_BANANA_MODEL!,
        contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio: '9:16',
            imageSize: '2K'
          }
        }
      })
    } catch (err) {
      logger.error('gemini.failed', {
        request_id: requestId,
        latencyMs: Date.now() - geminiStart,
        error: err instanceof Error ? err.message : String(err),
      })
      throw err
    }

    const result = extractGenerationResult(response)
    logger.info('gemini.success', {
      request_id: requestId,
      latencyMs: Date.now() - geminiStart,
      title: result.title,
      promptJson: json,
      candidateCount: response.candidates?.length ?? 0,
    })
    return result
```

**Step 5: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | head -40
```

Expected: no errors. If `requestId` type error appears in callers, that is expected — fixed in Task 7.

---

### Task 7: Update /api/photo route

**Files:**
- Modify: `app/api/photo/route.ts`

**Context:** Three things to fix:
1. `halt()` is defined but never called — errors are thrown with no catch
2. `engine.generate()` now requires `requestId`
3. Wrap the handler with `withAxiom` for automatic error/success reporting

**Step 1: Add imports at top of file**

Find:
```ts
import { NextRequest, NextResponse } from 'next/server'
```

Replace with:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { withAxiom } from '@/lib/axiom/server'
import { logger } from '@/lib/axiom/server'
```

**Step 2: Generate requestId and wrap handler in try/catch**

Find:
```ts
export async function POST(request: NextRequest) {
```

Replace with:
```ts
export const POST = withAxiom(async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const start = Date.now()
  try {
```

**Step 3: Pass requestId to engine.generate()**

Find:
```ts
  const { image, title } = await engine.generate(generateParams)
```

Replace with:
```ts
  const { image, title } = await engine.generate({ ...generateParams, requestId })
```

**Step 4: Add success log and close try/catch before return**

Find:
```ts
  return NextResponse.json(completeMoment as MomentWithPhotos)
}
```

Replace with:
```ts
    logger.info('photo.generated', {
      request_id: requestId,
      userId,
      momentId,
      mode,
      latencyMs: Date.now() - start,
    })
    return NextResponse.json(completeMoment as MomentWithPhotos)
  } catch (error) {
    return halt(error as Error)
  }
})
```

**Step 5: Verify TypeScript compiles cleanly**

```bash
pnpm build 2>&1 | head -50
```

Expected: no errors.

---

### Task 8: Smoke test

**Step 1: Run dev server**

```bash
pnpm dev
```

**Step 2: Trigger a generation**

Open the app in browser, log in, generate one photo.

**Step 3: Check Axiom dashboard**

In Axiom → your dataset → Stream view, you should see:
- One or more request logs from `proxy.ts` (page loads)
- `gemini.success` event with `latencyMs` and `title`
- `photo.generated` event with `userId`, `momentId`, `mode`, `latencyMs`

**Step 4: Trigger an error (optional)**

Temporarily set `GEMINI_API_KEY=invalid` in `.env.local`, trigger a generation, check Axiom for a `gemini.failed` event.

**Step 5: Commit all changes**

```bash
git add -A
git commit -m "feat: add axiom logging for request tracing and gemini generation"
```
