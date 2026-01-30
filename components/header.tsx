'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-provider'
import { cn } from '@/lib/utils'
import { Aperture, ShoppingBag } from 'lucide-react'

export const Header = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const routes = [
    { href: '/studio', label: 'Studio', icon: Aperture },
    { href: '/store', label: 'Store', icon: ShoppingBag },
  ]

  if (!user) return (
    <header className="sticky top-4 z-50 h-16 flex w-full items-center justify-between px-4"></header>
  )

  return (
    <header className="sticky top-4 z-50 h-16 flex w-full items-center justify-between px-8">
      <div className="flex flex-1 items-center">
        <Link
          href="/studio"
          className={cn(
            'text-xl font-bold',
            'transition-all duration-300',
          )}>
          <img src="/kanojo.svg" className='h-12' alt="Kanojo Studio" />
        </Link>
      </div>
      <nav className="flex items-center elevation-2 rounded-full gap-2 glass h-12">
        {routes.map(route => (
          <Link key={route.href} href={route.href}>
            <Button
              variant={pathname === route.href ? 'default' : 'ghost'}
              className={cn('h-12 rounded-full w-30 justify-start p-1 gap-1',
                pathname === route.href ? 'bg-white': ''
              )}>
              <div className="icon">
                <route.icon className="h-5! w-5!" />
              </div>
              {route.label}
            </Button>
          </Link>
        ))}
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
