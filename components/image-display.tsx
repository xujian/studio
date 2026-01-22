'use client'

import { Button } from '@/components/ui/button'
import { Download, RefreshCw, Loader2 } from 'lucide-react'
import Image from 'next/image'

type ImageDisplayProps = {
  imageUrl: string | null
  prompt: string | null
  isLoading: boolean
  error: string | null
  onRegenerate: () => void
}

export const ImageDisplay = ({
  imageUrl,
  prompt,
  isLoading,
  error,
  onRegenerate,
}: ImageDisplayProps) => {
  const handleDownload = async () => {
    if (!imageUrl) return

    const response = await fetch(imageUrl)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kanojo-studio-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">
            Generating your image...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">{error}</p>
          <Button onClick={onRegenerate} className="mt-4" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!imageUrl) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>Your generated image will appear here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1">
        <Image
          src={imageUrl}
          alt={prompt || 'Generated image'}
          fill
          className="object-contain"
          priority
        />
      </div>

      <div className="mt-4 flex gap-2">
        <Button onClick={handleDownload} className="flex-1">
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
        <Button onClick={onRegenerate} variant="outline" className="flex-1">
          <RefreshCw className="mr-2 h-4 w-4" />
          Regenerate
        </Button>
      </div>
    </div>
  )
}
