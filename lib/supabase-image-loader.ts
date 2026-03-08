/**
 * Custom Next.js image loader for Supabase image transforms.
 * Rewrites `/storage/v1/object/public/` → `/storage/v1/render/image/public/`
 * so Supabase Pro handles resizing and WebP conversion server-side.
 */
export default function supabaseLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}): string {
  // Local images (e.g. /face.png) — return as-is
  if (src.startsWith('/')) return src

  // Non-Supabase URLs — return as-is
  if (!src.includes('/storage/v1/object/public/')) return src

  const url = new URL(src)
  url.pathname = url.pathname.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  )
  url.searchParams.set('width', width.toString())
  url.searchParams.set('quality', (quality ?? 100).toString())
  url.searchParams.set('resize', 'contain')
  return url.toString()
}
