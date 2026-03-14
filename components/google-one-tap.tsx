'use client'

import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

export function GoogleOneTap() {
  const supabase = createClient()
  const router = useRouter()

  const initialize = async () => {
    const [nonce, hashedNonce] = await generateNonce()

    const { data: { session } } = await supabase.auth.getSession()
    if (session) return

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      params: { nonce: hashedNonce },
      callback: async ({ credential }: { credential: string }) => {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: credential,
          nonce,
        })
        if (!error) router.refresh()
      },
    })

    if (process.env.NODE_ENV === 'production') {
      window.google.accounts.id.prompt()
    }

    // Render button if the login page's target element is in the DOM
    const buttonEl = document.getElementById('google-signin-button')
    if (buttonEl) {
      window.google.accounts.id.renderButton(buttonEl, {
        type: 'standard',
        theme: 'filled_black',
        text: 'continue_with',
        size: 'large',
        shape: 'circle',
        width: '382',
      })
    }
  }

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      onReady={() => { void initialize() }}
    />
  )
}
