'use client'

import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from './ui'

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
    <Button
      onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
      className="flex size-9 items-center justify-center rounded-full border border-border bg-background transition-colors glass"
      aria-label="Toggle theme">
      {currentTheme === 'dark' ? (
        <Sun className="size-5 text-foreground" />
      ) : (
        <Moon className="size-5 text-foreground" />
      )}
    </Button>
  )
}
