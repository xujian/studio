'use client'

import { useState, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Camera, Loader2, Pencil } from 'lucide-react'

type Props = {
  name: string
  avatar: string
  createdAt: string
}

export const AccountProfileForm = ({ name: initialName, avatar: initialAvatar, createdAt }: Props) => {
  const [name, setName] = useState(initialName)
  const [avatar, setAvatar] = useState(initialAvatar)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

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
    setName(initialName)
    setEditing(false)
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await fetch('/api/account/avatar', { method: 'POST', body: formData })
      const { url } = await res.json()
      if (url) {
        setAvatar(url)
        queryClient.invalidateQueries({ queryKey: ['profile'] })
      }
    } finally {
      setUploading(false)
    }
  }

  const initials = name?.[0]?.toUpperCase() ?? '?'

  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatar} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
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
            Member since {new Date(createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
    </Card>
  )
}
