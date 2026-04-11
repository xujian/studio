'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Avatar } from '@/components/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, Loader2, Pencil } from 'lucide-react'
import { useUpload } from '@/hooks/use-upload'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/compress-image'
import { assetUrl, uploadUrl } from '@/lib/utils'
import { Profile } from '@/lib/types'
import { profile } from 'console'

type Props = {
  user: Profile
}

export const AccountProfileForm = ({ user }: Props) => {
  const [name, setName] = useState(user.name)
  const [avatar, setAvatar] = useState(user.avatar)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const supabase = createClient()
  const { upload, uploading } = useUpload({ bucket: 'uploads' })

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setName(user.name)
    setEditing(false)
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    compressImage(file).then(compressed => {
      upload(file, {
        onSuccess: async (result) => {
          await supabase
            .from('profiles')
            .update({ avatar: result.path })
            .eq('id', session.user.id)
          setAvatar(result.path)
          queryClient.invalidateQueries({ queryKey: ['profile'] })
        },
      })
    })
  }

  const initials = name?.[0]?.toUpperCase() ?? '?'

  const avatarUrl = useMemo(() => {
    return avatar.startsWith('http') ? avatar : uploadUrl(avatar)
  }, [avatar])

  return (
    <Card>
      <CardContent>
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <Avatar user={user} className="h-16 w-16" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity disabled:cursor-not-allowed">
            {uploading ? (
              <Loader2 className="size-4 text-white animate-spin" />
            ) : (
              <Camera className="size-4 text-white" />
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSave()
                  if (e.key === 'Escape') handleCancel()
                }}
                className="h-8"
              />
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving ? <Loader2 className="size-3 animate-spin" /> : 'Save'}
              </Button>
              <Button onClick={handleCancel} disabled={saving} variant="ghost" size="sm">
                Cancel
              </Button>
            </div>
          ) : (
            <div className="group flex items-center gap-2">
              <p className="font-medium truncate">{name || 'No name set'}</p>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                <Pencil className="size-3.5" />
              </button>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            Member since {new Date(user.created).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
      </CardContent>
    </Card>
  )
}
