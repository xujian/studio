'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'

export const ThemeToggle = () => {
  const { theme, setTheme, resolvedTheme } = useTheme()
  
  // Use useSyncExternalStore to handle SSR/client hydration properly
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  if (!mounted) {
    return null
  }

  const currentTheme = theme === 'system' ? resolvedTheme : theme

  return (
    <button
      onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
      className='flex size-9 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-accent'
      aria-label='Toggle theme'
    >
      {currentTheme === 'dark' ? (
        <Sun className='size-5 text-foreground' />
      ) : (
        <Moon className='size-5 text-foreground' />
      )}
    </button>
  )
}
