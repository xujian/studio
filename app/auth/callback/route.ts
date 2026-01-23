import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/studio'

  if (code) {
    const cookieStore = await cookies()

    // Determine redirect URL
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    let redirectUrl: string

    if (isLocalEnv) {
      redirectUrl = `${origin}${next}`
    } else if (forwardedHost) {
      redirectUrl = `https://${forwardedHost}${next}`
    } else {
      redirectUrl = `${origin}${next}`
    }

    // Collect cookies that will be set during the auth exchange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cookiesToSet: Array<{ name: string; value: string; options?: Record<string, any> }> = []

    // Create a promise that resolves when setAll is called
    let resolveSetAll: () => void
    const setAllPromise = new Promise<void>((resolve) => {
      resolveSetAll = resolve
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesArray) {
            // Store cookies for later application to the response
            cookiesArray.forEach(({ name, value, options }) => {
              // Add to our collection
              cookiesToSet.push({ name, value, options })

              // Try to set in cookie store (for server-side reads)
              try {
                const cookieOptions = {
                  ...options,
                  path: options?.path ?? '/',
                  sameSite: (options?.sameSite as 'lax' | 'strict' | 'none') ?? 'lax',
                  secure: isLocalEnv ? false : true,
                  httpOnly: options?.httpOnly ?? false,
                }
                cookieStore.set(name, value, cookieOptions)
              } catch {
                // Cookie store is read-only in this context
              }
            })

            // Resolve the promise once cookies are collected
            resolveSetAll()
          },
        },
      }
    )

    // Exchange code for session (this will trigger setAll asynchronously)
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    // Wait for setAll to be called (with a timeout)
    await Promise.race([
      setAllPromise,
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1000)),
    ])

    if (!error) {
      // Create the redirect response
      const redirectResponse = NextResponse.redirect(redirectUrl)

      // Apply all collected cookies to the redirect response
      cookiesToSet.forEach(({ name, value, options }) => {
        const cookieOptions = {
          ...options,
          path: options?.path ?? '/',
          sameSite: (options?.sameSite as 'lax' | 'strict' | 'none') ?? 'lax',
          secure: isLocalEnv ? false : true,
          httpOnly: options?.httpOnly ?? false,
        }

        redirectResponse.cookies.set(name, value, cookieOptions)
      })

      return redirectResponse
    } else {
      console.error('Session exchange failed:', error)
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_error`)
}
