'use client'

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/button'
import { useAssets } from '@/hooks/use-assets'
import { useUploadAsset } from '@/hooks/use-upload-asset'
import { useDeleteAsset } from '@/hooks/use-delete-asset'
import { useBus } from '@/lib/bus'
import { createClient } from '@/lib/supabase/client'
import { assetUrl, cn } from '@/lib/utils'
import type { Asset, AssetType } from '@/lib/types'
import { Loader2, Plus, Trash2, Check, X } from 'lucide-react'

interface AssetsManagerProps {
  type: AssetType
  onClose: () => void
}

export function AssetsManager({ type, onClose }: AssetsManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [userId, setUserId] = useState('')
  const $bus = useBus()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setUserId(data.session.user.id)
    })
  }, [])

  const { data: assets = [] } = useAssets()
  const uploadAsset = useUploadAsset()
  const deleteAsset = useDeleteAsset()

  const filtered = assets.filter(a => a.type === type)

  const handleUse = (asset: Asset) => {
    if (!asset.id) return
    $bus.emit('mixin:select', { type, assetId: asset.id })
    onClose()
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const name = file.name.replace(/\.[^.]+$/, '')
    uploadAsset.mutate({ file, name, type }, {
      onSettled: () => {
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    })
  }

  const label = type.charAt(0).toUpperCase() + type.slice(1)

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{label}</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadAsset.isPending}
            className="gap-1.5">
            {uploadAsset.isPending
              ? <Loader2 className="size-4 animate-spin" />
              : <Plus className="size-4" />}
            Upload
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {filtered.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No {label.toLowerCase()} assets yet. Upload one to get started.
        </p>
      )}

      <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-5">
        {filtered.map(asset => {
          const isOwned = asset.user_id === userId
          return (
            <div key={asset.id} className="group relative overflow-hidden rounded-xl border bg-muted">
              <div className="relative aspect-square w-full overflow-hidden">
                {asset.path ? (
                  <Image
                    src={assetUrl(asset.path)}
                    alt={asset.name || ''}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 33vw, 20vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-2">
                    <p className="line-clamp-4 text-xs text-muted-foreground">{asset.content}</p>
                  </div>
                )}
              </div>

              <p className="truncate px-2 py-1.5 text-xs">{asset.name}</p>

              <div className={cn(
                'absolute inset-0 flex flex-col items-center justify-center gap-1.5',
                'bg-black/60 opacity-0 transition-opacity group-hover:opacity-100'
              )}>
                <Button
                  size="sm"
                  className="h-7 gap-1 rounded-full px-3 text-xs"
                  onClick={() => handleUse(asset)}>
                  <Check className="size-3" />
                  Use
                </Button>
                {isOwned && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 gap-1 rounded-full px-3 text-xs"
                    onClick={() => asset.id && deleteAsset.mutate({ id: asset.id, path: asset.path })}
                    disabled={deleteAsset.isPending}>
                    <Trash2 className="size-3" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
