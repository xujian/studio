'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/button'
import { X } from 'lucide-react'
import { MomentView } from './moment-view'
import type { MomentViewProps } from './moment-view'

type MomentModalProps = Omit<MomentViewProps, 'onClose' | 'onDragStateChange'>

export function MomentModal(props: MomentModalProps) {
  const router = useRouter()
  const [isDragging, setIsDragging] = React.useState(false)
  const onClose = () => {
    if (document.startViewTransition) {
      document.startViewTransition(() => router.back())
    } else {
      router.back()
    }
  }

  // ESC key listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="glass absolute inset-0 bg-black/50! modal-backdrop-enter"
        style={{ opacity: isDragging ? 0.5 : 1 }}
        onClick={onClose}
      />
      <MomentView
        {...props}
        onClose={onClose}
        onDragStateChange={setIsDragging}
      />
      {/* Close Button */}
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
