'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { useRouter } from 'next/navigation'
import { Sparkles, Image as ImageIcon } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export const Header = () => {
  const pathname = usePathname()
  const { user } = useUser()
  const supabase = createClient()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return null

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/studio" className="text-xl font-bold">
            Kanojo Studio
          </Link>

          <nav className="flex gap-1">
            <Link href="/studio">
              <Button
                variant={pathname === '/studio' ? 'secondary' : 'ghost'}
                size="sm"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Studio
              </Button>
            </Link>
            <Link href="/gallery">
              <Button
                variant={pathname === '/gallery' ? 'secondary' : 'ghost'}
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
    </header>
  )
}
