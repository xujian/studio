'use client'

import Image from 'next/image'
import * as React from 'react'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { compressImage } from '@/lib/compress-image'
import { useUpload, type UploadResult } from '@/hooks/use-upload'
import { Button } from './button'
import { Loader2, Upload as UploadIcon, X } from 'lucide-react'

export interface UploadHandle {
  /** Removes the uploaded file from storage and resets the component */
  clear: () => Promise<void>
  /** Programmatically upload a file (e.g. from paste or drop in a parent) */
  upload: (file: File) => Promise<void>
  /** Set preview from an already-uploaded image (url = display URL, storagePath = path in bucket) */
  setPreview: (url: string, storagePath: string) => void
}

type PathOption = string | ((opts: { userId: string }) => string)

export type UploadProps = {
  /**
   * destination of the uploading
   */
  path: PathOption
  onComplete: (storagePath: string) => void
  onError?: () => void
  placeholder?: string
  className?: string
  initialPreview?: string
  children?: React.ReactNode
} & React.ComponentProps<'div'>

export const Upload = forwardRef<UploadHandle, UploadProps>(function Upload(
  {
    path,
    onComplete,
    onError,
    placeholder = 'Upload image here',
    className,
    initialPreview,
    children
  },
  ref
) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { upload, remove, uploading } = useUpload({ path })
  const [preview, setPreview] = useState<string | null>(initialPreview ?? null)
  const [uploaded, setUploaded] = useState<Pick<
    UploadResult,
    'bucket' | 'storagePath'
  > | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const clear = async () => {
    if (uploaded) {
      await remove(uploaded.bucket, uploaded.storagePath)
    }
    setPreview(null)
    setUploaded(null)
  }

  const setPreviewFromExternal = (url: string, storagePath: string) => {
    setPreview(url)
    setUploaded({ bucket: 'assets', storagePath })
  }

  useImperativeHandle(ref, () => ({ clear, upload: processFile, setPreview: setPreviewFromExternal }))

  const processFile = async (file: File) => {
    const compressed = await compressImage(file)
    setPreview(URL.createObjectURL(compressed))
    upload(compressed, {
      onSuccess: ({ bucket, storagePath }) => {
        setUploaded({ bucket, storagePath })
        onComplete(storagePath)
      },
      onError: () => {
        setPreview(null)
        onError?.()
      }
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await processFile(file)
    // Reset input so the same file can be re-selected
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
    if (!file || !file.type.startsWith('image/')) return
    await processFile(file)
  }

  const inputId = React.useId()

  return (
    <div
      className={`relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-1 border-dashed bg-muted transition-colors hover:border-foreground/30 ${isDragging ? 'border-foreground/60 bg-muted/80' : 'border-border'} ${className ?? ''}`}
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
        {preview ? (
          <Image
            src={preview}
            alt="Upload preview"
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <UploadIcon className="size-6" aria-hidden="true" />
            <span className="text-xs">{placeholder}</span>
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
      {preview && !uploading && (
        <Button
          type="button"
          size="icon-sm"
          onClick={e => {
            e.stopPropagation()
            clear()
          }}
          className="absolute top-2 right-2 z-10 flex size-6 items-center justify-center rounded-full bg-background/80 text-foreground hover:bg-background"
          aria-label="Remove image">
          <X className="size-3" />
        </Button>
      )}
      {children}
    </div>
  )
})
