'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const STEPS: { coach: string; text: string }[] = [
  { coach: 'face',     text: 'Pick a face to start' },
  { coach: 'mixins',   text: 'Layer your style with Mixins' },
  { coach: 'textarea', text: 'Describe your portrait here' },
]

type Props = {
  step: 0 | 1 | 2 | 3
}

type Rect = { top: number; left: number; width: number; height: number }

export function StudioCoachMarks({ step }: Props) {
  const [rect, setRect] = useState<Rect | null>(null)

  useEffect(() => {
    if (step === 0) return
    const s = STEPS[step - 1]
    const el = document.querySelector(`[data-coach="${s.coach}"]`)
    if (!el) return
    const r = el.getBoundingClientRect()
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
  }, [step])

  if (step === 0 || !rect) return null

  const { text } = STEPS[step - 1]
  const beaconCx = rect.left + rect.width / 2
  const beaconCy = rect.top + rect.height / 2

  return (
    <div className="pointer-events-none fixed inset-0 z-[200]">
      <span
        className="absolute flex h-4 w-4 -translate-x-1/2 -translate-y-1/2"
        style={{ left: beaconCx, top: beaconCy }}>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
        <span className="relative inline-flex h-4 w-4 rounded-full bg-primary" />
      </span>
      <div
        className={cn(
          'absolute -translate-x-1/2 whitespace-nowrap',
          'rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground shadow-lg',
        )}
        style={{ left: beaconCx, top: beaconCy - 36 }}>
        {text}
      </div>
    </div>
  )
}
