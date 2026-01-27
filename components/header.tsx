'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-provider'
import { cn } from '@/lib/utils'
import { Sparkles, Image as ImageIcon } from 'lucide-react'

export const Header = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (!user) return (
    <header className="sticky top-4 z-50 h-16 flex w-full items-center justify-between px-4"></header>
  )

  return (
    <header className="sticky top-4 z-50 h-16 flex w-full items-center justify-between px-4">
      <div className="flex flex-1 items-center">
        <Link
          href="/studio"
          className={cn(
            'text-xl font-bold',
            'transition-all duration-300',
            'glow-primary-hover hover:scale-105'
          )}>
          Kanojo Studio
        </Link>
      </div>
      <nav className="flex items-center glass elevation-2 rounded-full">
        <Link href="/studio">
          <Button
            variant={pathname === '/studio' ? 'default' : 'ghost'}
            size="sm">
            <Sparkles className="mr-2 h-4 w-4" />
            Studio
          </Button>
        </Link>
        <Link href="/store">
          <Button
            variant={pathname === '/store' ? 'default' : 'ghost'}
            size="sm">
            <ImageIcon className="mr-2 h-4 w-4" />
            Store
          </Button>
        </Link>
      </nav>
      <div className="flex flex-1 items-center justify-end gap">
        <ThemeToggle />
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.userMetadata?.avatar_url} />
          <AvatarFallback>
            {user.userMetadata?.fullName?.[0] || user.email?.[0]}
          </AvatarFallback>
        </Avatar>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </header>
  )
}
