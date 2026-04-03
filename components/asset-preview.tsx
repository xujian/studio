'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Asset } from '@/lib/types'
import { assetUrl, cn } from '@/lib/utils'
import { assetPreviewModes } from '@/lib/assets-config'

type AssetPreviewProps = {
  asset: Asset
} & React.ComponentProps<'div'>

export const AssetPreview = ({ asset, ...props }: AssetPreviewProps) => {
  const [svgError, setSvgError] = useState(false)

  return (
    <div {...props} className={cn(
      'asset-preview relative w-full aspect-square',
      'rounded-2xl overflow-hidden',
      props.className,
    )}>
      {asset.path
        ? (<Image
              src={assetUrl(asset.path)}
              alt={asset.name || 'Asset'}
              fill
              className="object-cover bg-neutral"
              sizes="(max-width: 768px) 50vw, 25vw"
            />)
        : assetPreviewModes[asset.type] === 'svg'
          ? (<>
              <Image
                src={`/asset-preview/${asset.type}/backdrop.jpg`}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              {!svgError
                ? (<img
                    src={`/asset-preview/${asset.type}/${asset.name}.svg`}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={() => setSvgError(true)}
                  />)
                : (<div className="absolute inset-0 flex items-end p-3">
                    <span className="text-xs text-white/60">{asset.title || asset.name}</span>
                  </div>)
              }
            </>)
          : (<div className="asset-content flex h-full items-center justify-center p-3">
              <p className="line-clamp-6 text-xs text-muted-foreground">{asset.content}</p>
            </div>)
      }
      {/* Scrim */}
      <div className="absolute inset-x-0 bottom-0 h-24 rounded-b-2xl overflow-hidden bg-linear-to-t from-black/70 to-transparent" />
    </div>
  )
}
