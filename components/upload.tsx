'use client'

import Image from 'next/image'
import * as React from 'react'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { compressImage } from '@/lib/compress-image'
import { useUpload } from '@/hooks/use-upload'
import { Button } from './button'
import { Command, Loader2, Upload as UploadIcon, X } from 'lucide-react'

export interface UploadHandle {
  /** Programmatically upload a file (e.g. from paste or drop in a parent) */
  upload: (file: File) => Promise<void>
}

type PathOption = string | ((opts: { userId: string }) => string)

export type UploadProps = {
  path: PathOption
  onComplete: (storagePath: string) => void
  onClear?: () => void
  onError?: () => void
  placeholder?: string | React.ReactNode
  className?: string
  /** Controlled image URL to display */
  value?: string
  children?: React.ReactNode
} & React.ComponentProps<'div'>

export const Upload = forwardRef<UploadHandle, UploadProps>(function Upload(
  {
    path,
    onComplete,
    onClear,
    onError,
    placeholder = 'Upload image here',
    className,
    value,
    children
  },
  ref
) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { upload, uploading } = useUpload({ path })
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const displayUrl = value || localPreview

  const processFile = async (file: File) => {
    const compressed = await compressImage(file)
    setLocalPreview(URL.createObjectURL(compressed))
    upload(compressed, {
      onSuccess: ({ storagePath }) => {
        onComplete(storagePath)
      },
      onError: () => {
        setLocalPreview(null)
        onError?.()
      }
    })
  }

  useImperativeHandle(ref, () => ({ upload: processFile }))

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
    console.log('handleDrop', file, e)
    if (!file || !file.type.startsWith('image/')) return
    await processFile(file)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLocalPreview(null)
    onClear?.()
  }

  const inputId = React.useId()

  return (
    <div
      className={`relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted transition-colors hover:border-foreground/30 ${isDragging ? 'border-foreground/60 bg-muted/80' : 'border-border'} ${className ?? ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}>
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
        {displayUrl
          ? (<Image
                src={displayUrl}
                alt="Upload preview"
                fill
                className="object-cover"
              />)
          : (<div className="flex flex-col items-center gap-2 text-muted-foreground">
              <UploadIcon className="size-6" aria-hidden="true" />
              <p className="text-sm">{placeholder}</p>
              <p>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  className="button">
                  Browse files
                </Button>
              </p>
              <p>&nbsp;</p>
              <p className="text-xs leading-3">Or Drag and Drop image here</p>
              <p className="text-xs leading-3">or paste image here</p>
            </div>
          )}
        {uploading && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-background/60"
            aria-live="polite">
            <Loader2 className="size-6 animate-spin" />
            <span className="sr-only">Uploading...</span>
          </div>
        )}
      </label>
      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {displayUrl && !uploading && (
        <Button
          type="button"
          size="icon-sm"
          onClick={handleClear}
          className="absolute top-2 right-2 z-10 flex size-6 items-center justify-center rounded-full bg-background/80 text-foreground hover:bg-background"
          aria-label="Remove image">
          <X className="size-3" />
        </Button>
      )}
      {children}
    </div>
  )
})
