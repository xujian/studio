import { MomentWithPhotos } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Badge } from './ui/badge'

export function MomentInfo(moment: MomentWithPhotos) {
  return (
    <div className="flex h-full w-full flex-col p-4">
      <Badge className="bg-black/80 text-foreground">Title</Badge>
      <h1
        className={cn(
          'text-3xl font-bold',
          moment.title ? 'text-white' : 'text-gray-500'
        )}>
        {moment.title || '(NO TITLE)'}
      </h1>
      {
      moment.created_at && (
      <div className="flex items-end gap-2">
        <p className="text-xl text-gray-400">
          {new Date(moment.created_at).toLocaleString('en-US', {
              weekday: 'short',
            })
          }
        </p>
        <p className="text-xl text-gray-100">
          {new Date(moment.created_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric'
            })
          }
        </p>
        <p className="text-sm text-gray-500">
          {new Date(moment.created_at).toLocaleString('en-US', {
              year: 'numeric'
            })
          }
        </p>
      </div>)
      }
    </div>
  )
}
