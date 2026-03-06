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
