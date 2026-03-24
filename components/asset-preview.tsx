'use client'

import Image from 'next/image'
import type { Asset } from '@/lib/types'
import { assetUrl, cn } from '@/lib/utils'

type AssetPreviewProps = {
  asset: Asset
} & React.ComponentProps<'div'>

export const AssetPreview = ({ asset, ...props }: AssetPreviewProps) => {
  return (
    <div {...props} className={cn(
      'asset-preview relative w-full aspect-square',
      'rounded-3xl overflow-hidden',
      props.className,
      )}>
      {asset.path
        ? (<Image
              src={assetUrl(asset.path)}
              alt={asset.name || 'Asset'}
              fill
              className="object-cover bg-neutral"
              sizes="max-width: 768px) 50vw, 25vw"
            />)
        : (<div className="asset-content flex h-full items-center justify-center p-3">
            <p className="line-clamp-6 text-xs text-muted-foreground">{asset.content}</p>
          </div>)
      }
      {/* Scrim */}
      <div className="absolute inset-x-0 bottom-0 h-24 rounded-b-3xl overflow-hidden bg-linear-to-t from-black/70 to-transparent" />
    </div>
  )
}
