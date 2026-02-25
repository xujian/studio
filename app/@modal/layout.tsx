'use client'

import { useRouter, usePathname } from 'next/navigation'
import * as React from 'react'
import { Button } from '@/components/button'
import { X, Loader2 } from 'lucide-react'

export default function ModalLayout({
  children
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const isOpen = !!pathname.match(/^\/moments\/[^/]+/)

  const onClose = () => {
    if (document.startViewTransition) {
      document.startViewTransition(() => router.back())
    } else {
      router.back()
    }
  }

  React.useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="@modal fixed inset-0 z-100 flex items-center justify-center">
      <div
        className="modal-backdrop glass modal-backdrop-enter absolute inset-0 bg-black/50!"
        onClick={onClose}
      />
      <React.Suspense
        fallback={
          <div className="relative z-10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        }>
        {children}
      </React.Suspense>
      <Button
        onClick={onClose}
        variant="outline"
        size="icon"
        className="absolute top-4 right-4 z-20">
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
