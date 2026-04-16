'use client'

import Image from 'next/image'
import { useState } from 'react'
import { assetPreviewModes } from '@/lib/assets-config'
import type { Asset } from '@/lib/types'
import { assetUrl, cn } from '@/lib/utils'
import { assetStories } from './asset-stories'

type AssetPreviewProps = {
  asset: Asset
} & React.ComponentProps<'div'>

export const AssetPreview = ({ asset, ...props }: AssetPreviewProps) => {

  const subject = asset || {
    type: ''
  }
  const Story = assetStories[asset.type]

  return (
    <div
      {...props}
      className={cn(
        'asset-preview relative aspect-square w-full',
        'overflow-hidden rounded-2xl',
        props.className
      )}>
      {asset.path ? (
        <Image
          src={assetUrl(asset.path)}
          alt={asset.name || 'Asset'}
          fill
          className="bg-neutral object-cover"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      ) : Story !== null ? (
        <Story asset={asset} />
      ) : (
        <div className="asset-content flex h-full items-center justify-center p-3">
          <p className="line-clamp-6 text-xs text-muted-foreground">
            {asset.content}
          </p>
        </div>
      )}
      {/* Scrim */}
      <div className="absolute inset-x-0 bottom-0 h-24 overflow-hidden rounded-b-2xl bg-linear-to-t from-black/70 to-transparent" />
    </div>
  )
}
