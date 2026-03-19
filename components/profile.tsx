'use client'

import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSyncExternalStore } from 'react'
import { Credits } from '@/components/credits'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { useAuth } from '@/context/auth-provider'
import { LogOut, Settings, CircleUserRound } from 'lucide-react'
import { ThemeSwitch } from './theme-switch'

export const Profile = () => {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { theme, setTheme, resolvedTheme } = useTheme()

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  if (!user)
    return (
      <Link href="/login">
        <CircleUserRound className="h-8 w-8" />
      </Link>
    )

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
        <Button
          size="icon"
          className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.userMetadata?.avatar_url} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="glass flex flex-col gap-1 w-56 rounded-xl border p-1">
        <div className="bg-background rounded-lg overflow-hidden">
          <div className="bg-secondary rounded-lg p-2">
            <p className="truncate text-sm font-medium">{name}</p>
            {user.email && (
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
          <Credits />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full cursor-pointer justify-start gap-2"
          onClick={() => router.push('/account')}>
          <CircleUserRound className="h-4 w-4" />
          Account
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full cursor-pointer justify-start gap-2"
          onClick={() => router.push('/settings')}>
          <Settings className="h-4 w-4" />
          Settings
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full cursor-pointer justify-start gap-2 text-destructive"
          onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
        <div className="flex items-center justify-between bg-muted rounded-lg pl-2">
          <span className="text-sm font-medium">Theme</span>
          <ThemeSwitch />
        </div>
      </PopoverContent>
    </Popover>
  )
}
