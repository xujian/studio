'use client'

import Image from 'next/image'
import * as React from 'react'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { useUpload, type UploadResult } from '@/hooks/use-upload'
import { compressImage } from '@/lib/compress-image'
import { Loader2, Upload as UploadIcon } from 'lucide-react'

export interface UploadHandle {
  /** Removes the uploaded file from storage and resets the component */
  clear: () => Promise<void>
}

type PathOption =
  | string
  | ((opts: { userId: string }) => string)

interface UploadProps {
  path: PathOption
  onComplete: (storagePath: string) => void
  onError?: () => void
  placeholder?: string
  className?: string,
  initialPreview?: string
  children?: React.ReactNode
}

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
  const [uploaded, setUploaded] = useState<Pick<UploadResult, 'bucket' | 'storagePath'> | null>(null)

  useImperativeHandle(ref, () => ({
    clear: async () => {
      if (uploaded) {
        await remove(uploaded.bucket, uploaded.storagePath)
      }
      setPreview(null)
      setUploaded(null)
    }
  }))

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
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
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  const inputId = React.useId()

  return (
    <label
      htmlFor={inputId}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click() } }}
      className={`relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted transition-colors hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className ?? ''}`}>
      {preview
        ? (<Image src={preview} alt="Upload preview" fill className="object-cover" />)
        : (<div className="flex flex-col items-center gap-2 text-muted-foreground">
            <UploadIcon className="size-6" aria-hidden="true" />
            <span className="text-xs">{placeholder}</span>
          </div>)
      }
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60" aria-live="polite">
          <Loader2 className="size-6 animate-spin" />
          <span className="sr-only">Uploading...</span>
        </div>
      )}
      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      { children }
    </label>
  )
})
