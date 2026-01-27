'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-provider'
import { Sparkles, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Header = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (!user) return null

  return (
    <header className="sticky top-4 z-50 px-4 rounded-full">
      <div className={cn(
        "container mx-auto rounded-full",
        "glass elevation-2",
        "animate-float-up"
      )}>
        <div className="flex h-16 items-center justify-between px-6">
          {/* Logo with glow */}
          <div className="flex items-center gap-6">
            <Link
              href="/studio"
              className={cn(
                "text-xl font-bold",
                "transition-all duration-300",
                "hover:scale-105 glow-primary-hover"
              )}
            >
              Kanojo Studio
            </Link>

            {/* Navigation buttons */}
            <nav className="flex gap-2">
              <Link href="/studio">
                <Button
                  variant={pathname === '/studio' ? 'default' : 'ghost'}
                  size="sm"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Studio
                </Button>
              </Link>
              <Link href="/gallery">
                <Button
                  variant={pathname === '/gallery' ? 'default' : 'ghost'}
                  size="sm"
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Gallery
                </Button>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
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
        </div>
      </div>
    </header>
  )
}
