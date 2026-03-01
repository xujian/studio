'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export const CtaButton = ({ size = 'lg' }: { size?: 'sm' | 'lg' }) => {
  const supabase = createClient()

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
  }

  return (
    <Button onClick={handleSignIn} size={size} className="rounded-full px-8 glow-primary-hover">
      Start creating — it&apos;s free
    </Button>
  )
}
