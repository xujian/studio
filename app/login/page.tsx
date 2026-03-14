'use client'

import { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  // When navigating to /login client-side, the GSI script is already loaded
  // but onReady won't fire again — render the button manually
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google) {
      const buttonEl = document.getElementById('google-signin-button')
      if (buttonEl) {
        window.google.accounts.id.renderButton(buttonEl, {
          type: 'standard',
          theme: 'filled_black',
          text: 'continue_with',
          size: 'large',
          shape: 'circle',
          width: '100%',
        })
      }
    }
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className={cn('w-full max-w-md', 'elevation-3 animate-float-up')}>
        <CardContent className="space-y-8 p-8">
          <div className="text-center">
            <h1
              className={cn(
                'text-4xl font-bold tracking-tight',
                'glow-primary-hover vibrancy-text'
              )}>
              Kanojo Studio
            </h1>
            <p className="mt-2 text-muted-foreground">
              AI-Powered Portrait Photography
            </p>
          </div>
          <div id="google-signin-button"
            className="w-full flex justify-center bg-black rounded-full border border-gray-300 overflow-hidden transition-all duration-200 hover:shadow-lg" />
        </CardContent>
      </Card>
    </div>
  )
}
