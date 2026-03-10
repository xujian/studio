'use client'

import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/button'
import { AssetCard } from '@/components/asset-card'
import { useAssets } from '@/hooks/use-assets'
import { useUploadAsset } from '@/hooks/use-upload-asset'
import { useDeleteAsset } from '@/hooks/use-delete-asset'
import { useBus } from '@/lib/bus'
import { createClient } from '@/lib/supabase/client'
import type { Asset, AssetType } from '@/lib/types'
import { ArrowLeft, Loader2, Plus } from 'lucide-react'

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
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose} className="size-10 rounded-full">
            <ArrowLeft className="size-6" strokeWidth={2.5} />
          </Button>
          <div>
            <h2 className="text-2xl font-semibold leading-none mb-0">{label}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{filtered.length} {filtered.length === 1 ? 'asset' : 'assets'} of type {label} in your library</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-5">
        {filtered.map(asset => (
          <AssetCard
            key={asset.id}
            data={asset}
            owned
            onUse={() => handleUse(asset)}
            onDelete={asset.user_id === userId && asset.id
              ? () => deleteAsset.mutate({ id: asset.id!, path: asset.path })
              : undefined}
          />
        ))}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadAsset.isPending}
          className="rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {uploadAsset.isPending
            ? <Loader2 className="size-6 animate-spin" />
            : <Plus className="size-6" />}
          <span className="text-xs">Add an {label.toLowerCase()} asset</span>
        </button>
      </div>
    </div>
  )
}
