# Project Specification: Kanojo Studio

## 🌟 Vision
**Kanojo Studio** is a high-end AI-powered portrait and lifestyle photography platform. Users can generate professional-grade personal photos by fine-tuning creative parameters (makeup, hair, attire, lighting, scene) while maintaining consistent identity via advanced AI features like Face Swap and Image-to-Image.

---

## 🛠 Tech Stack
| Layer        | Technology                                      |
| ------------ | ----------------------------------------------- |
| Framework    | Next.js 16 (App Router)                         |
| Styling      | Tailwind CSS 4 (CSS variables for theming)      |
| UI           | Shadcn UI + Lucide React                        |
| Backend      | Supabase (Auth, PostgreSQL, Storage, Realtime)  |
| AI Engine    | Google Gemini (Multimodal & Vision)             |
| State/Forms  | React Hook Form + Zod + TanStack Query          |

---

## 🚀 Core Features

### 1. Prompt-Based Generation
- Users describe their desired photo using natural language.
- System enhances prompts with professional photography keywords.

### 2. Face Swap (Identity Preservation)
- Upload a reference face image.
- Generated photos maintain the user's facial identity.

### 3. Image-to-Image (Structural Reference)
- Upload an origin image as a pose/composition reference.
- AI generates new content while preserving the structure.

### 4. The Mixer (Rule-Based Prompt Builder)
- Multi-step wizard to define:
  - **Style**: Professional, Cinematic, Vintage, Anime, etc.
  - **Makeup**: Natural, Glamour, Editorial, etc.
  - **Hair Style**: Length, color, styling.
  - **Attire**: Formal, Casual, Costume, etc.
  - **Scene/Background**: Studio, Outdoor, Urban, Fantasy, etc.
- Rules are concatenated into an optimized master prompt.

### 5. Prompt Management
- **History**: View all past generations with parameters.
- **Templates**: Save and reuse complex configurations.
- **Favorites**: Star and organize best results.

---

## 🎨 UI/UX Requirements

### Design Principles
- **Dark Mode**: Default theme with optional light mode.
- **Responsive**: Mobile-first, works on all devices.
- **Premium Feel**: Glassmorphism, smooth animations, micro-interactions.
- **Accessibility**: Proper contrast, keyboard navigation, ARIA labels.

### Key Screens
1. **Dashboard**: Recent generations, quick actions, usage stats.
2. **Studio**: Main creation interface with Mixer and preview.
3. **Gallery**: Grid view of all generations with filters.
4. **Templates**: Saved configurations library.
5. **Settings**: Account, preferences, API usage.

---

## 🗄 Database Schema (Supabase)

```sql
-- Users (handled by Supabase Auth)

-- Profiles
profiles (
  id uuid references auth.users,
  display_name text,
  avatar_url text,
  credits integer default 100,
  created_at timestamptz
)

-- Generations
generations (
  id uuid primary key,
  user_id uuid references profiles,
  prompt text,
  enhanced_prompt text,
  parameters jsonb,
  face_reference_url text,
  origin_image_url text,
  result_url text,
  seed bigint,
  status text, -- pending, processing, completed, failed
  created_at timestamptz
)

-- Templates
templates (
  id uuid primary key,
  user_id uuid references profiles,
  name text,
  description text,
  parameters jsonb,
  is_public boolean default false,
  created_at timestamptz
)