'use client'

import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Google Identity Services type shim — only what we need
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: object) => void
          prompt: () => void
          renderButton: (element: HTMLElement, config: object) => void
        }
      }
    }
  }
}

const generateNonce = async (): Promise<[string, string]> => {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(nonce))
  const hashedNonce = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return [nonce, hashedNonce]
}

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const initializeGoogleOneTap = async () => {
    const [nonce, hashedNonce] = await generateNonce()

    // Skip One Tap if already logged in
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      router.refresh()
      return
    }

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      nonce: hashedNonce,
      use_fedcm_for_prompt: true,
      callback: async ({ credential }: { credential: string }) => {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: credential,
          nonce,
        })
        if (!error) router.refresh()
      },
    })

    window.google.accounts.id.prompt()

    // Render the GSI button as fallback
    const buttonEl = document.getElementById('google-signin-button')
    if (buttonEl) {
      window.google.accounts.id.renderButton(buttonEl, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: buttonEl.offsetWidth,
      })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Script
        src="https://accounts.google.com/gsi/client"
        onReady={() => { void initializeGoogleOneTap() }}
      />
      <Card
        className={cn(
          'w-full max-w-md',
          'elevation-3 animate-float-up'
        )}
      >
        <CardContent className="space-y-8 p-8">
          <div className="text-center">
            <h1 className={cn(
              'text-4xl font-bold tracking-tight',
              'glow-primary-hover vibrancy-text'
            )}>
              Kanojo Studio
            </h1>
            <p className="mt-2 text-muted-foreground">
              AI-Powered Portrait Photography
            </p>
          </div>

          <div id="google-signin-button" className="w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
