import { Avatar as UiAvatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Profile } from '@/lib/types'
import { cn, uploadUrl } from '@/lib/utils'
import { CircleUserRound } from 'lucide-react'

export type AvatarProps = {
  user: Profile
}

export const Avatar = ({user, className}: AvatarProps & { className?: string }) => {
  const initials = user?.name?.[0] || ''
  return (
    <UiAvatar className={cn('avatar h-8 w-8', className)}>
      { user
        ? (<>
            <AvatarImage src={user.avatar.startsWith('http') ? user.avatar : uploadUrl(user.avatar)} />
            <AvatarFallback>{initials}</AvatarFallback>
          </>)
        : (<CircleUserRound className="h-8 w-8" />)
      }
    </UiAvatar>)
}