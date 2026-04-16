'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import { Asset, AssetPreviewSettings } from '@/lib/types'


type AssetStageProps = {
  settings: AssetPreviewSettings
} & React.ComponentProps<'div'>

// Returns blur px from aperture, focal length, and subject distance.
// Higher focal / lower f-number / closer distance = more background blur.
function computeBokeh(aperture?: number, focal?: number, distance?: number): number {
  if (!aperture) return 0
  const dist = Math.max(distance ?? 2, 0.1)  // meters, default 2m portrait distance
  const intensity = (focal || 50) / (aperture || 8) / dist
  if (intensity < 10) return 0  // deep enough DoF — no blur
  return Math.min(Math.round(intensity * 0.5), 20)
}

export function AssetStage({
  settings,
  className,
  children
}: AssetStageProps) {
  // console.log('preview', settings)
  const preview: AssetPreviewSettings = {
    depth: 2,
    translate: '0,20%,-200px',
    rotate: {
      x: '',
      y: '',
      z: ''
    },
    distance: 5,
    perspective: '50%,50%',
    ...settings
  }
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setDims({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { w, h } = dims
  const depth = w * preview.depth!
  const gridSize = `12.5% 12.5%`
  const lineColor = '#ffffff33',
    bgColor = 'transparent'
  const hLines = `linear-gradient(${lineColor} 1px, transparent 1px)`
  const vLines = `linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`
  const grid = `linear-gradient(${lineColor} 1px, transparent 1px),
    linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`

  const face = (extra: CSSProperties): CSSProperties => ({
    position: 'absolute',
    backgroundSize: gridSize,
    backgroundColor: bgColor,
    border: `1px solid ${lineColor}`,
    ...extra
  })
  const translate = useMemo(
    () => {
      let [x = '0', y = '0', z = '0'] = (preview.translate || '0, 0, 0').split(/\,\s*/)
      if (!z.endsWith('px')) {
        const floatZ = parseFloat(z)
        z = Math.abs(floatZ) <= 10
          ? `${Math.floor(w * floatZ)}px`
          : `${floatZ}px`
      }
      return [x,y,z].join(',')
    },
    [preview])
  const bokeh = computeBokeh(preview.aperture, preview.focal, preview.distance)

  return (
    <div ref={containerRef} className={cn('h-full w-full', className)}>
      {w > 0 && (
        <div style={{
            perspective: `${w * 2}px`,
            perspectiveOrigin: preview.perspective || '50% 50%',
            width: w,
            height: h
          }}>
          <div
            style={{
              position: 'relative',
              width: w,
              height: h,
              transformStyle: 'preserve-3d'
            }}>
            {/* Back */}
            <div
              style={{
                ...face({
                  width: w,
                  height: h,
                  transform: `translateZ(-${depth}px)`
                }),
                backgroundImage: grid,
              }}
            />
            <div className={cn('scene absolute top-0 left-0 w-full h-full')}
              style={{
                transform: `translateZ(-${depth}px)`,
                filter: bokeh ? `blur(${bokeh}px)` : undefined
              }}>
              <img
                src="/scene.svg"
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            {/* Ceiling */}
            <div
              style={{
                ...face({
                width: w,
                height: depth,
                top: 0,
                transformOrigin: 'top center',
                transform: 'rotateX(-90deg)'
              }),
              backgroundImage: vLines,
            }}
            />
            {/* Right */}
            <div
              style={{
                ...face({
                  width: depth,
                  height: h,
                  right: 0,
                  transformOrigin: 'right center',
                  transform: 'rotateY(-90deg)'
                }),
                backgroundImage: hLines,
              }}
            />
            {/* Floor */}
            <div
              style={{
                ...face({
                  width: w,
                  height: depth,
                  bottom: 0,
                  transformOrigin: 'bottom center',
                  transform: 'rotateX(90deg)'
                }),
                backgroundImage: vLines,
              }}
            />
            {/* Left */}
            <div
              style={{
                ...face({
                  width: depth,
                  height: h,
                  left: 0,
                  transformOrigin: 'left center',
                  transform: 'rotateY(90deg)'
                }),
                backgroundImage: hLines,
              }} 
            />
            <div className={cn('figure absolute top-0 left-0 w-full h-full')}
              style={{
                transform: [
                  ...preview.translate ? [`translate3d(${translate})`] : [],
                    ...preview.rotate?.x ? [`rotateX(${preview.rotate.x})`] : [],
                    ...preview.rotate?.y ? [`rotateY(${preview.rotate.y})`] : [],
                    ...preview.rotate?.z ? [`rotateZ(${preview.rotate.z})`] : [],
                  ].join(' '),
                transformOrigin: 'bottom center'
              }}>
              <img
                src="/figure-front.svg"
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
