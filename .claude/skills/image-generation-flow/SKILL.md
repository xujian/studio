---
name: image-generation-flow
description: Explains the /api/photo generation pipeline (API route, engine, analyzers, delta storage, merge order). Load when working on app/api/photo, lib/engine.ts, lib/image-analyzer.ts, or lib/prompt-analyzer.ts.
---

## API Route (`/api/photo` POST)

1. Validate request with Zod (`engineRequestSchema`)
2. Authenticate user via Supabase session
3. Create or load moment record (baseline prompt + mixins)
4. Load asset data from database based on mixins
5. Call `engine.generate({ userId, prompt, assets, reference })`
6. Upload base64 image to Supabase Storage (`{userId}/{momentId}/{photoId}.{ext}`)
7. Insert photo record with deltas (only differences from moment baseline)
8. Return complete moment with all photos

## Engine (`lib/engine.ts`) — pure generation function, no auth

1. **Analyze inputs** → structured JSON baseline
   - Reference image → `ImageAnalyzer` (full scene description)
   - Text prompt → `PromptAnalyzer` (only explicit mentions)
   - Deep merge: prompt overrides reference
2. **Build assets** → face image parts + text sections
   - Face defaults to system face (`defaultAssets.face`) when not provided
   - `AssetsBuilder` produces image parts (face) and text sections (other assets)
   - Asset sections override corresponding JSON keys
3. **Assemble prompt** → face image parts + single combined JSON
4. **Generate** → Gemini API (9:16 portrait, 2K resolution)

## Key Services

- **ImageAnalyzer** (`lib/image-analyzer.ts`) - Analyzes reference images using Gemini Vision, extracts detailed structured data, caches results for 30 minutes
- **PromptAnalyzer** (`lib/prompt-analyzer.ts`) - Converts natural language prompts to structured JSON format matching ImageAnalyzer output, enables prompt merging
- **Engine** (`lib/engine.ts`) - Pure generation function: takes userId, prompt, assets, reference; returns base64 image. No auth or database access.
