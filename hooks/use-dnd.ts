'use client'

import { useState } from 'react'

type UseDndOptions = {
  onFile: (file: File) => void | Promise<void>
}

export function useDnd({ onFile }: UseDndOptions) {
  const [dropping, setDropping] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDropping(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropping(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDropping(false)

    const file = e.dataTransfer.files?.[0]
    if (file?.type.startsWith('image/')) {
      await onFile(file)
      return
    }

    // Dragging an image from a web page provides a URL, not a File
    const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('URL')
    if (!url) return
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      if (!blob.type.startsWith('image/')) return
      await onFile(new File([blob], 'dropped-image', { type: blob.type }))
    } catch {
      // silently ignore failed URL fetches
    }
  }

  return {
    dropping,
    onDragOver: handleDragOver,
    onDragEnter: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
  }
}
