'use client'

import Image from 'next/image'
import * as React from 'react'
import { Loader2, Upload as UploadIcon, X } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

export type DropzoneProps = {
  /** Called with the raw File when user picks or drops an image */
  onFile: (file: File) => void | Promise<void>
  onClear?: () => void
  /** Controlled preview — a URL or data URL to display */
  value?: string
  /** Show loading spinner overlay */
  uploading?: boolean
  placeholder?: string
  className?: string
} & Omit<React.ComponentProps<'div'>, 'onDrop'>

export function Dropzone({
  onFile,
  onClear,
  value,
  uploading,
  placeholder = 'Upload image here',
  className,
  ...props
}: DropzoneProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const inputId = React.useId()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await onFile(file)
    e.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

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

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClear?.()
  }

  return (
    <div
      className={cn(
        'relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted transition-colors hover:border-foreground/30',
        isDragging ? 'border-foreground/60 bg-muted/80' : 'border-border',
        className
      )}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      {...props}>
      <label
        htmlFor={inputId}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
        className="absolute inset-0 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        {value
          ? (<Image src={value} alt="Preview" fill className="object-cover" />)
          : (<div className="flex flex-col items-center gap-2 text-muted-foreground">
              <UploadIcon className="size-6" aria-hidden="true" />
              <p className="text-sm">{placeholder}</p>
              <p>
                <Button type="button" size="xs" variant="outline" className="button">
                  Browse files
                </Button>
              </p>
              <p>&nbsp;</p>
              <p className="text-xs leading-3">Or Drag and Drop image here</p>
            </div>)
        }
      </label>
      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {uploading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-background/60"
          aria-live="polite">
          <Loader2 className="size-6 animate-spin" />
          <span className="sr-only">Uploading...</span>
        </div>
      )}
      {value && !uploading && (
        <Button
          type="button"
          size="icon-sm"
          onClick={handleClear}
          className="absolute top-2 right-2 z-10 flex size-6 items-center justify-center rounded-full bg-background/80 text-foreground hover:bg-background"
          aria-label="Remove image">
          <X className="size-3" />
        </Button>
      )}
    </div>
  )
}
