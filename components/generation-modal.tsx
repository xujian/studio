'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Trash2, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { Generation } from '@/lib/types'

type GenerationModalProps = {
  generation: Generation | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (id: string) => void
}

export const GenerationModal = ({
  generation,
  open,
  onOpenChange,
  onDelete,
}: GenerationModalProps) => {
  const router = useRouter()

  if (!generation) return null

  const handleDownload = async () => {
    if (!generation.url) return

    const response = await fetch(generation.url)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kanojo-studio-${generation.id}.png`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this generation?')) {
      onDelete(generation.id)
      onOpenChange(false)
    }
  }

  const handleRegenerate = () => {
    router.push(`/studio?prompt=${encodeURIComponent(generation.prompt)}`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Generation Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {generation.url && (
            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
              <Image
                src={generation.url}
                alt={generation.prompt}
                fill
                className="object-contain"
                priority
              />
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold">Prompt</h3>
            <p className="text-sm text-muted-foreground">
              {generation.prompt}
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            Generated{' '}
            {formatDistanceToNow(new Date(generation.created_at), {
              addSuffix: true,
            })}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleDownload} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button
              onClick={handleRegenerate}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate
            </Button>
            <Button onClick={handleDelete} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
