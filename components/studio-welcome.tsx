'use client'

import Image from 'next/image'
import { useBus } from '@/lib/bus'

const PROMPT_CHIPS = [
  'Cinematic street portrait, golden hour',
  'Studio headshot, clean white background',
  'Dreamy outdoor portrait, soft bokeh',
]

export function StudioWelcome() {
  const $bus = useBus()

  const handleChip = (prompt: string) => {
    $bus.emit('prompt:prefill', prompt)
  }

  return (
    <div className="flex flex-col items-center gap-8 py-16 w-full">
      <div className="relative w-48 aspect-9/16 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
        <Image
          src="/example.jpg"
          alt="Example portrait"
          fill
          className="object-cover"
          sizes="192px"
          priority
        />
      </div>
      <div className="text-center flex flex-col gap-2">
        <h2 className="text-2xl">Your studio starts here</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Pick a face, describe the mood, generate your first portrait.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {PROMPT_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => handleChip(chip)}
            className="rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
            {chip}
          </button>
        ))}
      </div>
    </div>
  )
}
