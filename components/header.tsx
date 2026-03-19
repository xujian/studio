'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Profile } from '@/components/profile'
import { Button } from '@/components/ui/button'
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

  const testSelected = (href: string) => {
    return pathname.startsWith(href)
  }

  return (
    <header className="fixed top-4 z-50 h-16 flex w-full items-center justify-between px-4 md:px-8">
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
      <nav aria-label="Main navigation" className="flex items-center elevation-2 rounded-full p-1 gap-0 glass h-12 md:h-10">
        {routes.map(route => (
          <Link key={route.href} href={route.href} aria-current={testSelected(route.href) ? 'page' : undefined}>
            <Button
              variant={testSelected(route.href) ? 'default' : 'ghost'}
              className="h-10 md:h-8 rounded-full min-w-0 md:min-w-30 justify-center md:justify-start gap-1 px-2 md:pl-1 md:pr-6 cursor-pointer">
              <div className="icon" aria-hidden="true">
                <route.icon className="h-5! w-5!" />
              </div>
              <span className="hidden md:inline">{route.label}</span>
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
