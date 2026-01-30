'use client'

import { useState, useEffect } from 'react'
import { Fabric } from '@/components/fabric'
import { ImageDisplay } from '@/components/image-display'
import type { PromptInput } from '@/lib/validations'
import { useGenerateMutation } from '@/hooks/use-generations'
import Image from 'next/image'

export default function StudioPage() {
  const [currentImage, setCurrentImage] = useState<{
    url: string
    prompt: string
  } | null>(null)
  const [currentPrompt, setCurrentPrompt] = useState('')

  const generateMutation = useGenerateMutation()

  const handleSubmit = async (data: PromptInput) => {
    setCurrentPrompt(data.prompt)
    try {
      const result = await generateMutation.mutateAsync(data.prompt)
      setCurrentImage({
        url: result.url,
        prompt: result.prompt
      })
    } catch {
      // Error handled by mutation
    }
  }

  const handleRegenerate = () => {
    if (currentPrompt) {
      handleSubmit({ prompt: currentPrompt })
    }
  }

  const [photos, setPhotos] = useState<{ url: string }[]>([])

  useEffect(() => {
    fetch('/photos.json')
      .then(res => res.json())
      .then(data => setPhotos(data))
      .catch(err => console.error('Failed to load photos:', err))
  }, [])

  return (
    <section className="w-full flex items-center justify-center pb-52">
      <div className="photos flex flex-row flex-wrap justify-center gap animate-float-up"
        style={{ animationDelay: '0.1s' }}>
        { photos.map((photo, index) => (
          <div
            className="w-[270px]"
            key={index}>
            <Image 
              className="aspect-9/16 w-full rounded object-cover"
              src={photo.url}
              width={270}
              height={480}
              alt="Generated image" />
          </div>
        ))}
        {/* <ImageDisplay
          imageUrl={currentImage?.url || null}
          prompt={currentImage?.prompt || null}
          isLoading={generateMutation.isPending}
          error={generateMutation.error?.message || null}
          onRegenerate={handleRegenerate}
        /> */}
      </div>
      <Fabric
        onSubmit={handleSubmit}
        isLoading={generateMutation.isPending}
        defaultValue={currentPrompt} />
    </section>
  )
}
