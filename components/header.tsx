'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Profile } from '@/components/profile'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-provider'
import { cn } from '@/lib/utils'
import { Aperture, ShoppingBag, Earth, BookOpen } from 'lucide-react'

export const Header = () => {
  const pathname = usePathname()

  const routes = [
    { href: '/studio', label: 'Studio', icon: Aperture },
    { href: '/store', label: 'Store', icon: ShoppingBag },
    { href: '/community', label: 'Community', icon: Earth },
    { href: '/magazine', label: 'Magazine', icon: BookOpen },
  ]

  return (
    <header className="fixed top-4 z-50 h-16 flex w-full items-center justify-between px-8">
      <div className="flex flex-1 items-center">
        <Link
          href="/"
          className={cn(
            'text-xl font-bold',
            'transition-all duration-300',
          )}>
          <img src="/kanojo.svg" className='h-12' alt="Kanojo Studio" />
        </Link>
      </div>
      <nav className="flex items-center elevation-2 rounded-full p-1 gap-0 glass h-10">
        {routes.map(route => (
          <Link key={route.href} href={route.href}>
            <Button
              variant={pathname === route.href ? 'default' : 'ghost'}
              className={cn('h-8 rounded-full min-w-30 justify-start gap-1 pl-1 pr-6 cursor-pointer',
                pathname === route.href ? 'bg-white/90': ''
              )}>
              <div className="icon">
                <route.icon className="h-5! w-5!" />
              </div>
              {route.label}
            </Button>
          </Link>
        ))}
      </nav>
      <div className="flex flex-1 items-center justify-end">
        <Profile />
      </div>
    </header>
  )
}
