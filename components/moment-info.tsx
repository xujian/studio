'use client'

import { useState, useRef, useEffect } from 'react'
import { Pencil } from 'lucide-react'
import { MomentWithPhotos } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Badge } from './ui/badge'
import { Textarea } from './ui/textarea'
import { useUpdateMomentTitle } from '@/hooks/use-moments'

export function MomentInfo(moment: MomentWithPhotos) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(moment.title || '')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { mutate: updateTitle } = useUpdateMomentTitle()

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const save = () => {
    setEditing(false)
    const trimmed = value.trim()
    setValue(trimmed)
    if (trimmed !== (moment.title || '')) {
      updateTitle({ id: moment.id, title: trimmed })
    }
  }

  return (
    <div className="flex h-full w-full flex-col p-4">
      <Badge className="bg-background/80 text-foreground">Title</Badge>
      {editing ? (
        <Textarea
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              save()
            }
            if (e.key === 'Escape') {
              setValue(moment.title || '')
              setEditing(false)
            }
          }}
          rows={2}
          className="bg-transparent text-3xl! font-bold px-0 py-2 text-foreground resize-none border-none focus-visible:ring-0"
        />
      ) : (
        <h1
          role="button"
          tabIndex={0}
          aria-label={`Edit title: ${value || 'No title'}`}
          onClick={() => setEditing(true)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing(true) } }}
          className={cn(
            'group flex items-center gap-2 text-3xl font-bold cursor-pointer',
            moment.title ? 'text-foreground' : 'text-muted-foreground'
          )}>
          {value || '(NO TITLE)'}
          <Pencil aria-hidden="true" className="size-4 opacity-0 group-hover:opacity-60 focus-within:opacity-60 transition-opacity" />
        </h1>
      )}
      {
      moment.created_at && (
      <div className="flex items-end gap-2">
        <p className="text-xl text-muted-foreground">
          {new Date(moment.created_at).toLocaleString('en-US', {
              weekday: 'short',
            })
          }
        </p>
        <p className="text-xl text-foreground">
          {new Date(moment.created_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric'
            })
          }
        </p>
        <p className="text-sm text-muted-foreground">
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
