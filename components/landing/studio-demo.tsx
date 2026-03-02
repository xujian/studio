'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'
import { CtaButton } from './cta-button'

const FACES = [
  { seed: 'portrait-f1', label: 'Face 1' },
  { seed: 'portrait-f2', label: 'Face 2' },
  { seed: 'portrait-f3', label: 'Face 3' },
  { seed: 'portrait-f4', label: 'Face 4' },
]

const RESULTS = ['portrait-r1', 'portrait-r2', 'portrait-r3', 'portrait-r4']

const OUTFITS = ['Casual', 'Editorial', 'Formal']
const SCENES = ['Studio', 'Outdoor', 'Urban']

export const StudioDemo = () => {
  const [selectedFace, setSelectedFace] = useState<number | null>(null)
  const [selectedOutfit, setSelectedOutfit] = useState('Casual')
  const [selectedScene, setSelectedScene] = useState('Studio')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [resultSeed, setResultSeed] = useState('')

  const handleFaceSelect = (index: number) => {
    setSelectedFace(index)
    setGenerated(false)
  }

  const handleGenerate = () => {
    if (selectedFace === null) return
    setGenerating(true)
    setGenerated(false)
    setTimeout(() => {
      setResultSeed(RESULTS[selectedFace])
      setGenerating(false)
      setGenerated(true)
    }, 1500)
  }

  return (
    <section aria-label="Studio demo" className="flex flex-col items-center gap-8 px-4">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Try it yourself
        </p>
        <h2 className="font-playfair text-3xl md:text-4xl font-bold">
          The Studio, in action.
        </h2>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto text-sm">
          Select a face, mix your style, and see how it works — no sign-up needed.
        </p>
      </div>

      <Card className="w-full max-w-5xl overflow-hidden p-0 glass elevation-3">
        <CardContent className="flex flex-col md:flex-row p-0">

          {/* Left panel — controls */}
          <div className="flex flex-col gap-6 p-6 md:w-2/5 border-b md:border-b-0 md:border-r border-border">

            {/* Face picker */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Face
              </p>
              <div className="flex gap-2">
                {FACES.map((face, i) => (
                  <button
                    key={face.seed}
                    onClick={() => handleFaceSelect(i)}
                    aria-label={face.label}
                    className={cn(
                      'relative w-14 shrink-0 aspect-[9/16] overflow-hidden rounded-lg cursor-pointer',
                      'transition-all duration-200',
                      selectedFace === i
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105'
                        : 'opacity-50 hover:opacity-80'
                    )}
                  >
                    <img
                      src={`https://picsum.photos/seed/${face.seed}/120/213`}
                      alt=""
                      width={120}
                      height={213}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Outfit */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Outfit
              </p>
              <div className="flex flex-wrap gap-2">
                {OUTFITS.map((outfit) => (
                  <button
                    key={outfit}
                    onClick={() => { setSelectedOutfit(outfit); setGenerated(false) }}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm cursor-pointer transition-all duration-200',
                      selectedOutfit === outfit
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {outfit}
                  </button>
                ))}
              </div>
            </div>

            {/* Scene */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Scene
              </p>
              <div className="flex flex-wrap gap-2">
                {SCENES.map((scene) => (
                  <button
                    key={scene}
                    onClick={() => { setSelectedScene(scene); setGenerated(false) }}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm cursor-pointer transition-all duration-200',
                      selectedScene === scene
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {scene}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate */}
            <Button
              onClick={handleGenerate}
              disabled={selectedFace === null || generating}
              size="lg"
              className="mt-auto w-full gap-2 cursor-pointer"
            >
              {generating ? (
                <>
                  <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 shrink-0" />
                  Generate
                </>
              )}
            </Button>
          </div>

          {/* Right panel — portrait output */}
          <div className="relative md:w-3/5 aspect-[9/16] md:aspect-auto md:min-h-[520px] bg-muted/20">

            {/* Skeleton during generation */}
            {generating && (
              <div className="absolute inset-0 animate-pulse bg-muted/40" />
            )}

            {/* Portrait image */}
            {!generating && (
              <img
                src={
                  generated
                    ? `https://picsum.photos/seed/${resultSeed}/600/1067`
                    : `https://picsum.photos/seed/demo-placeholder/600/1067`
                }
                alt={generated ? 'Generated portrait' : ''}
                width={600}
                height={1067}
                className={cn(
                  'w-full h-full object-cover transition-opacity duration-500',
                  generated ? 'opacity-100' : 'opacity-15'
                )}
              />
            )}

            {/* Idle label */}
            {!generated && !generating && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-sm text-muted-foreground">Select a face to begin</p>
              </div>
            )}

            {/* Watermark */}
            {generated && (
              <span className="absolute bottom-3 right-3 text-xs text-white/40 font-medium tracking-widest select-none">
                Kanojo Studio
              </span>
            )}
          </div>

        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-muted-foreground">Like what you see?</p>
        <CtaButton size="lg" />
      </div>
    </section>
  )
}
