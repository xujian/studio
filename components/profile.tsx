'use client'

import { useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Credits } from '@/components/credits'
import { useAuth } from '@/context/auth-provider'
import { LogOut, Moon, Settings, Sun, User } from 'lucide-react'

export const Profile = () => {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { theme, setTheme, resolvedTheme } = useTheme()

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  if (!user) return null

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const name = user.userMetadata?.fullName || user.email
  const initials = user.userMetadata?.fullName?.[0] || user.email?.[0]
  const currentTheme = theme === 'system' ? resolvedTheme : theme

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.userMetadata?.avatar_url} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="glass w-56 rounded-xl border p-1">
        <div className="mb-1 px-2 py-1.5">
          <p className="truncate text-sm font-medium">{name}</p>
          {user.email && (
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          )}
        </div>

        <Credits className="mb-1 rounded-lg" />

        <Button
          variant="ghost"
          size="sm"
          className="w-full cursor-pointer justify-start gap-2"
          onClick={() => router.push('/studio')}>
          <User className="h-4 w-4" />
          Profile
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full cursor-pointer justify-start gap-2"
          onClick={() => router.push('/settings')}>
          <Settings className="h-4 w-4" />
          Settings
        </Button>
        {mounted && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full cursor-pointer justify-start gap-2"
            onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}>
            {currentTheme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            {currentTheme === 'dark' ? 'Light mode' : 'Dark mode'}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full cursor-pointer justify-start gap-2 text-destructive"
          onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </PopoverContent>
    </Popover>
  )
}
