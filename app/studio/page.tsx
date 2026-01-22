'use client'

import { useState } from 'react'
import { PromptForm } from '@/components/prompt-form'
import { ImageDisplay } from '@/components/image-display'
import { RecentPrompts } from '@/components/recent-prompts'
import { useGenerateMutation } from '@/hooks/use-generations'
import { useRouter } from 'next/navigation'
import type { PromptInput } from '@/lib/validations'

export default function StudioPage() {
  const router = useRouter()
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
        prompt: result.prompt,
      })
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleSelectPrompt = (prompt: string) => {
    setCurrentPrompt(prompt)
    router.push(`/studio?prompt=${encodeURIComponent(prompt)}`)
  }

  const handleRegenerate = () => {
    if (currentPrompt) {
      handleSubmit({ prompt: currentPrompt })
    }
  }

  return (
    <div className="container mx-auto h-[calc(100vh-4rem)] p-4">
      <div className="grid h-full gap-4 lg:grid-cols-5">
        {/* Left Panel */}
        <div className="space-y-4 lg:col-span-2">
          <PromptForm
            onSubmit={handleSubmit}
            isLoading={generateMutation.isPending}
            defaultValue={currentPrompt}
          />

          <RecentPrompts onSelectPrompt={handleSelectPrompt} />
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-3">
          <div className="h-full rounded-lg border bg-card p-4">
            <ImageDisplay
              imageUrl={currentImage?.url || null}
              prompt={currentImage?.prompt || null}
              isLoading={generateMutation.isPending}
              error={generateMutation.error?.message || null}
              onRegenerate={handleRegenerate}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
