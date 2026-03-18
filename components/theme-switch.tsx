'use client'

import { useTheme } from 'next-themes'
import { useState, useSyncExternalStore } from 'react'
import { Switch } from '@/components/ui/switch'
import { MoonIcon, SunIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export const ThemeSwitch = () => {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [checked, setChecked] = useState<boolean>(true)

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
    <Switch
      checked={currentTheme === 'dark'}
      className="h-7 w-12 bg-transparent data-[state=checked]:bg-muted/50 data-[state=unchecked]:bg-secondary"
      icon={
        currentTheme === 'dark' ? (
          <MoonIcon className="h-4 w-4" />
        ) : (
          <SunIcon className="h-4 w-4" />
        )
      }
      onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
      thumbClassName="h-6 w-6 data-[state=checked]:translate-x-0 data-[state=unchecked]:translate-x-full"
    />
  )
}
