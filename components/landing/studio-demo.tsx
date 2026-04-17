'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn, photoUrl, storageUrl } from '@/lib/utils'
import { CtaButton } from './cta-button'
import {
  User,
  Scissors,
  Shirt,
  TreePine,
  Sun,
  Camera,
  Heart,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { assets } from '@/lib/assets-config'

type Layer = {
  id: string
  label: string
  Icon: LucideIcon
}

const PORTRAIT_URL = photoUrl(
  'cd99d106-419b-4ebf-aa09-29e5f6d688d1',
  'c78a7a86-b22e-442d-bcae-7aaa7d44f365',
  '4530820e-10fa-454c-a5a2-ab1febfb4e04'
)
const CARD_W = 180
const CARD_H = 320
const Z_STEP = 120 // px between layers when expanded

export const StudioDemo = () => {
  const [expanded, setExpanded] = useState(false)

  return (
    <section
      aria-label="Studio demo"
      className="flex flex-col items-center gap-8 px-4">
      <div className="text-center">
        <p className="mb-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Generation Layers
        </p>
        <h2 className="md:text-4xl">
          Anatomy of a Portrait
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Pick a face, layer your Mixins, describe the mood — and generate your
          portrait in seconds.
        </p>
      </div>
      <div className="flex w-full max-w-5xl items-center justify-center gap-10 overflow-x-auto px-6 py-20">
        <div
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
          style={{ perspective: 'none', cursor: 'pointer' }}>
          <div
            className="transition-transform duration-700"
            style={{
              transformStyle: 'preserve-3d',
              transform: expanded 
                ? 'rotateX(0deg) rotateY(45deg)'
                : 'rotateX(0deg) rotateY(0deg)',
              display: 'grid',
              gridTemplate: `${CARD_H}px / ${CARD_W}px`
            }}>
            {assets.map((asset, i) => {
              const z = expanded ? (i - 4) * Z_STEP : i * 2
              const expandDelay = i * 0.04
              const collapseDelay = (assets.length - 1 - i) * 0.04
              return (
                <div
                  key={asset.id}
                  style={{
                    gridArea: '1 / 1',
                    zIndex: i,
                    transform: `translateZ(${z}px) ${expanded ? 'rotateZ(30deg)' : ''}`,
                    transition: `transform 0.65s cubic-bezier(0.85, 0, 0.15, 1) ${expanded ? expandDelay : collapseDelay}s`,
                    width: `${CARD_W}px`,
                    height: `${CARD_H}px`
                  }}
                  className="absolute flex flex-col bg-muted p-4 rounded-2xl border-card border">
                  <div className={cn('absolute mb-3 flex items-center gap-2 transition-top',
                    expanded ? '-top-10' : 'top-3'
                    )}>
                    <div className="shrink-0 rounded-full bg-white/25 p-1.5">
                      <img src={asset.icon} alt={asset.label} className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-xs font-semibold tracking-wide text-white">
                      {asset.label}
                    </span>
                  </div>
                  <div className="flex flex-1 items-center justify-center overflow-hidden rounded-xl">
                    
                  </div>
                </div>
              )
            })}
            <div className={`absolute rounded-2xl bg-cover overflow-hidden`} style={{
              width: `${CARD_W}px`,
              height: `${CARD_H}px`,
              transform: `translateZ(${expanded ? (assets.length - 4) * Z_STEP : 7 * 2}px) ${expanded ? 'rotateZ(30deg)' : ''}`,
              transition: `transform 0.65s cubic-bezier(0.85, 0, 0.15, 1) ${expanded ? assets.length * 0.04 : (assets.length - 1 - 7) * 0.04}s`,
              gridArea: '1 / 1',
              zIndex: assets.length 
            }}>
              <Image src={PORTRAIT_URL} alt="Portrait"
                className="h-full w-full object-cover"
                priority
                width={CARD_W}
                height={CARD_H}
                sizes="(min-width: 1024px) 33vw, 100vw" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-muted-foreground">Ready to try it?</p>
        <CtaButton />
      </div>
    </section>
  )
}
