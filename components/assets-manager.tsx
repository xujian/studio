'use client'

import { useState, useEffect } from 'react'
import { AssetCard } from '@/components/asset-card'
import { AssetCreateDialog } from '@/components/asset-create-dialog'
import { Button } from '@/components/button'
import { useBus } from '@/lib/bus'
import { createClient } from '@/lib/supabase/client'
import type { AssetWithPurchaseInfo, AssetType } from '@/lib/types'
import { useAssets } from '@/hooks/use-assets'
import { useDeleteAsset } from '@/hooks/use-delete-asset'
import { ArrowLeft, Plus } from 'lucide-react'

interface AssetsManagerProps {
  type: AssetType
  onClose: () => void
}

export function AssetsManager({ type, onClose }: AssetsManagerProps) {
  const [userId, setUserId] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setUserId(data.session.user.id)
    })
  }, [])

  const { data: assets = [] } = useAssets()
  console.log('assetsdata-----------------------------///:', assets)
  const filtered = assets.filter(a => a.type === type)
  const label = type.charAt(0).toUpperCase() + type.slice(1)

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-12 rounded-full">
            <ArrowLeft className="size-10" strokeWidth={3} />
          </Button>
          <div>
            <h2 className="my-0 text-2xl leading-none font-semibold">
              {label}
            </h2>
            <p className="my-0 text-sm text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? 'asset' : 'assets'} of
              type {label} in your library
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-5">
        {filtered.map(asset => (
          <AssetCard
            key={asset.id}
            data={asset}
          />
        ))}
        <button
          onClick={() => setDialogOpen(true)}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground">
          <Plus className="size-6" />
          <span className="text-xs">Add an {label.toLowerCase()} asset</span>
        </button>
      </div>

      <AssetCreateDialog
        type={type}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
