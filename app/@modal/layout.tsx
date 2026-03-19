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

  const closeButtonRef = React.useRef<HTMLButtonElement>(null)
  const modalRef = React.useRef<HTMLDivElement>(null)

  // Focus trap: keep focus inside modal
  React.useEffect(() => {
    if (!isOpen) return
    closeButtonRef.current?.focus()

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      className="@modal fixed inset-0 z-100 flex items-center justify-center">
      <div
        className="modal-backdrop glass modal-backdrop-enter absolute inset-0 bg-black/50!"
        onClick={onClose}
        aria-hidden="true"
      />
      <React.Suspense
        fallback={
          <div className="relative z-10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-foreground" />
          </div>
        }>
        {children}
      </React.Suspense>
      <Button
        ref={closeButtonRef}
        onClick={onClose}
        variant="outline"
        size="icon"
        aria-label="Close modal"
        className="absolute top-3 right-3 z-20 size-11 md:size-9">
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
