import Image from 'next/image'
import { useState } from 'react'
import { Asset, AssetType } from '@/lib/types'
import { Aperture, CircleGauge, LensConcave } from 'lucide-react'
import { AssetStage } from './asset-stage'
import { cn } from '@/lib/utils'

export type CameraStoryProps = {
  asset: Asset
}

export const CameraStory = ({ asset }: CameraStoryProps) => {
  const content = asset.content || {}
  let settings: Record<string, any> = {}
  if (typeof content === 'string') {
    try {
      const parsedContent = JSON.parse(content || '{}')
      settings = parsedContent.settings || {}
    } catch {
      settings = {}
    }
  } else {
    settings = Reflect.get(content, 'settings') || {}
  }
  // console.log('settings', settings)
  const preview = settings.__preview__ || {}
  return (
    <>
      <AssetStage settings={preview} />
      <div className="absolute top-0 left-0 w-full h-full">
        <img
          src="/camera.svg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      <div className="absolute top-0 left-0 w-full h-full text-xs font-bold text-muted-foreground">
        {settings.iso && (<div className="absolute right-6 bottom-6 flex items-center gap-1 ">
          ISO {settings.iso}
        </div>)}
        {settings.aperture && (<div className="absolute left-6 top-6 flex items-center gap-1">
          <Aperture className="w-4 h-4" /> {settings.aperture}
        </div>)}
        {settings.shutter && (<div className="absolute left-6 bottom-6 flex items-center gap-1">
          <CircleGauge className="w-4 h-4" /> {settings.shutter}
        </div>)}
        {settings.lens && (<div className="absolute left-6 top-12 flex items-center gap-1">
          <LensConcave className="w-4 h-4" /> {settings.lens}
        </div>)}
      </div>
    </>
  )
}

export const assetStories: Record<
  AssetType,
  React.FC<CameraStoryProps> | null
> = {
  face: null,
  hair: null,
  camera: CameraStory,
  makeup: null,
  outfit: null,
  scene: null,
  lighting: null,
  mood: null
}
