# Project Specification: Kanojo Studio

## Vision
**Kanojo Studio** is a AI portrait photography app for female.
---

## Key Idea
To write long prompt is hard. This app let users to pick predefined settings of **face**, **pose**, **scene**, **attire**, use text descriptions or just images, input these settings into a prompt generation engine, and then use the prompt generated to produce a photo.

## Narrow down the scope
1. Only generate realistic photos for female, no man, no pets, no anime
2. Aspect ratio: 9:16 (portrait)
3. Face is optional - if not provided, system uses a default face
---

## Key Screens
1. **Landing page/Login page**
2. **Studio**: Main creation interface with Producer and moments
3. **Store**: Official store to buy Kanojo Studio assets (faces, attires, poses, scenes)
4. **Community**: Share and view generated images from users
---

## Key data models
1. **Moment**: A generation session containing the original prompt, mixins used, and resulting photos. Can be shared to community.
2. **Asset**: Reusable resources stored in user's library or marketplace. Can be faces, reference photos, attires, scenes, etc. (image-based or text-based).
3. **Mixin**: Input used in a specific generation. Either references a saved asset, or contains ad-hoc uploads/text.
4. **Photo**: Output image from a generation.
5. **Post**: Moment shared to community, can be liked by users.
6. **User/Profile**: User account with credits and settings.


## Key UI components
1. **Header**: 
2. **Sidebar**: let user to manage assets, 
3. **Producer**: let user to input prompt, mix prompts and generate photos
4. **Moments**: list generations and photos
5. **Store**: list assets to sell
6. **Community**: list generated images from community
---

## Tech Stack
| Layer        | Technology                                      |
| ------------ | ----------------------------------------------- |
| Framework    | Next.js 16 (App Router)                         |
| Styling      | Tailwind CSS 4 (CSS variables for theming)      |
| UI           | Shadcn UI + Lucide React                        |
| Backend      | Supabase (Auth, PostgreSQL, Storage, Realtime)  |
| AI Engine    | Google Gemini (Multimodal & Vision)             |
| State/Forms  | React Hook Form + Zod + TanStack Query          |

## Configuration
App settings managed in `config.ts`:
- **Generation cost**: Credits per generation
- **Default face**: System default face URL when user doesn't provide one
- **New user credits**: Starting credits (10)
- **Asset pricing**: Pricing tiers for store assets

---

## Core Features

### 1. The Producer (Unified Generation Interface)

The Producer is the main creation interface where users combine inputs to generate photos.

**Input methods (can be combined):**
- **Face**: Select from library or upload new reference face (optional - uses system default if not provided)
- **Reference Image**: Upload for pose/composition guidance (optional)
- **Text Description**: Natural language prompt (optional)
- **Structured Settings** (optional):
  - **Pose**: Standing, sitting, dynamic, etc.
  - **Makeup**: Natural, Glamour, Editorial, etc.
  - **Hair**: Length, color, styling
  - **Attire**: Formal, Casual, Costume, etc.
  - **Scene**: Studio, Outdoor, Urban, Fantasy, etc.
  - **Camera**: DSLR, Mirrorless, Smartphone, etc.
  - **Lighting**: Natural, Studio, Golden hour, etc.
  - **Vibe**: Professional, Cinematic, Vintage, Editorial, etc.

**Example use cases:**
1. **Quick generation**: Face + text description ("beach sunset portrait")
2. **Reference-based**: Face + uploaded pose reference image
3. **Detailed control**: Face + structured settings (formal attire + studio lighting + professional vibe)
4. **Mixed approach**: Face + reference image + text refinements + selected settings

The system combines all inputs into an optimized master prompt for generation.

### 2. Assets Management
- **Faces**: Reference face images saved to library
- **References**: Reference images for pose/composition
- **Attires**: Reference images or text descriptions for attires
- **Scenes**: Reference images or text descriptions for scenes
- **Moments**: View all past generations with parameters and output images
- **Favorites**: Star and organize best results

### 3. Store
- Users can buy official assets (faces, attires, poses, scenes) from Kanojo Studio
- Purchased assets are added to user's library for use in generations
- Transactions tracked via purchases and credit history

### 4. Community
- Users can share their generated images to the community (as posts)
- Users can view and like other users' posts
---

## UI/UX Requirements

### Design Principles
- **Dark Mode**: Default theme with optional light mode.
- **Responsive**: Mobile-first, works on all devices.
- **Premium Feel**: Glassmorphism, smooth animations, micro-interactions.
- **Accessibility**: Proper contrast, keyboard navigation, ARIA labels.

---

## Database Schema (Supabase)

```sql
-- Users (handled by Supabase Auth)

-- Profiles
profiles (
  id uuid references auth.users,
  name text,
  avatar text,
  credits integer default 10,
  created_at timestamptz
)

-- Generations: user generation
moments (
  id uuid primary key,
  user_id uuid references profiles,
  prompt text,
  final_prompt text,
  seed bigint,
  status text, -- pending, processing, completed, failed
  created_at timestamptz
)

-- Reusable resources (personal library + official store)
assets (
  id uuid primary key,
  user_id uuid references profiles,  -- NULL = official Kanojo Studio asset
  name text,
  description text,
  type text, -- face, reference, attire, scene, etc.
  url text,  -- if image-based asset
  content text,  -- if text-based asset (e.g., "red dress description")
  is_public boolean default false,  -- true = visible in store
  price integer,  -- credits cost (NULL = personal asset, not for sale)
  created_at timestamptz
)

-- Asset purchases (only for official store items)
purchases (
  id uuid primary key,
  buyer_id uuid references profiles,
  asset_id uuid references assets,
  price integer,  -- credits spent at time of purchase
  created_at timestamptz,
  unique(buyer_id, asset_id)
)

-- Credit transaction history
transactions (
  id uuid primary key,
  user_id uuid references profiles,
  type text,  -- 'asset_purchase', 'generation_cost', 'credit_purchase', 'refund'
  amount integer,  -- negative = debit, positive = credit
  related_id uuid,  -- purchase_id, moment_id, etc. (nullable)
  description text,
  created_at timestamptz
)

-- Inputs used in a specific generation
mixins (
  id uuid primary key,
  moment_id uuid references moments,
  asset_id uuid references assets,  -- nullable: references asset if from library
  type text,  -- face, reference, attire, scene, etc.
  url text,  -- if ad-hoc upload (not from assets)
  content text,  -- if text input or prompt fragment
  created_at timestamptz
)

--- Photos output from a generation
photos (
  id uuid primary key,
  moment_id uuid references moments,
  url text,
  created_at timestamptz
)

-- Community posts
posts (
  id uuid primary key,
  user_id uuid references profiles,
  moment_id uuid references moments,
  created_at timestamptz
)

-- Likes (many-to-many)
likes (
  id uuid primary key,
  post_id uuid references posts,
  user_id uuid references profiles,
  created_at timestamptz,
  unique(post_id, user_id)
)