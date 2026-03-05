# Docker Deployment Guide

## Prerequisites

- Docker and Docker Compose installed on the server
- Git access to this repository
- Supabase project already set up (database schema applied, storage bucket created)
- Gemini API key

---

## 1. Create a Dockerfile

Create `Dockerfile` in the project root:

```dockerfile
FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

# ── deps stage ──────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── builder stage ────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars must be provided at build time — Next.js inlines them
# into the client bundle. They cannot be changed at runtime.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_APP_URL

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN pnpm build

# ── runner stage ─────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE  
ENV PORT=4242
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4242/api/health || exit 1

CMD ["node", "server.js"]
```

---

## 2. Enable Standalone Output

Add `output: 'standalone'` to `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  output: 'standalone',
  // ... rest of config
}
```

This makes Next.js produce a minimal self-contained build in `.next/standalone`.

---

## 3. Create `.dockerignore`

```
node_modules
.next
.env*
.git
.gitignore
tasks/
supabase/
*.md
```

---

## 4. Create `docker-compose.yml`

```yaml
services:
  studio:
    image: studio:${VERSION:-latest}
    build:
      context: .
      args:
        # NEXT_PUBLIC_* are baked into the bundle at build time.
        # Changing these here after a build has no effect.
        NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}
        NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL}
    ports:
      - "4242:4242"
    environment:
      # Server-side secrets injected at runtime only
      GEMINI_API_KEY: ${GEMINI_API_KEY}
    restart: unless-stopped
```

---

## 5. Set Environment Variables on the Server

On the server, create a `.env` file next to `docker-compose.yml` (never commit this):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
NEXT_PUBLIC_APP_URL=https://yourdomain.com
GEMINI_API_KEY=your-gemini-api-key
```

---

## 6. Deploy

**On the server:**

```bash
# Clone the repo
git clone <repo-url> studio
cd studio

# Copy your .env file here
# (transfer it from your machine, do not commit it)

# Build and start
docker compose up -d --build

# Check logs
docker compose logs -f studio
```

The app will be running on port `4242`.

---

## 7. Reverse Proxy (recommended)

Use Nginx or Caddy in front of the container to handle HTTPS.

**Caddy (simplest — auto HTTPS):**

```
yourdomain.com {
    reverse_proxy localhost:4242
}
```

**Nginx example** (requires Certbot or manual cert setup):

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:4242;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP → HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}
```

---

## 8. Update OAuth Redirect URL

After deploying, update the Google OAuth **Authorized redirect URI** in Google Cloud Console to:

```
https://yourdomain.com/auth/callback
```

And add the same URL to Supabase → Authentication → URL Configuration → Redirect URLs.

---

## Health Endpoint

The Dockerfile `HEALTHCHECK` pings `/api/health`. Add a minimal route:

```ts
// app/api/health/route.ts
export function GET() {
  return Response.json({ ok: true })
}
```

---

## Updating the App

```bash
git pull

# Build with a version tag so you can roll back
VERSION=v1.2.0 docker compose build
VERSION=v1.2.0 docker compose up -d
```

**Rolling back:**

```bash
VERSION=v1.1.0 docker compose up -d
```

> Omitting `VERSION` uses the `latest` tag and overwrites the previous image.
