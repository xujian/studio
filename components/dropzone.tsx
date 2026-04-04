'use client'

import Image from 'next/image'
import * as React from 'react'
import { compressImage } from '@/lib/compress-image'
import { Upload as UploadIcon, X } from 'lucide-react'
import { Button } from './button'

export type DropzoneProps = {
  /** Called with base64 data URL after file is picked and compressed */
  onFile: (dataUrl: string) => void
  onClear?: () => void
  /** Controlled preview — pass the data URL to display */
  value?: string
  placeholder?: string
  className?: string
} & Omit<React.ComponentProps<'div'>, 'onDrop'>

export function Dropzone({
  onFile,
  onClear,
  value,
  placeholder = 'Upload image here',
  className,
  ...props
}: DropzoneProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const inputId = React.useId()

  const processFile = async (file: File) => {
    const compressed = await compressImage(file)
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target!.result as string)
      reader.readAsDataURL(compressed)
    })
    onFile(dataUrl)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await processFile(file)
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
      await processFile(file)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClear?.()
  }

  return (
    <div
      className={`relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted transition-colors hover:border-foreground/30 ${isDragging ? 'border-foreground/60 bg-muted/80' : 'border-border'} ${className ?? ''}`}
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
      {value && (
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
