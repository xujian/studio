'use client'

import Image from 'next/image'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { useUpload, type UploadResult } from '@/hooks/use-upload'
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
  className?: string
}

export const Upload = forwardRef<UploadHandle, UploadProps>(function Upload(
  {
    path,
    onComplete,
    onError,
    placeholder = 'Upload image (optional)',
    className
  },
  ref
) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { upload, remove, uploading } = useUpload({ path })
  const [preview, setPreview] = useState<string | null>(null)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    upload(file, {
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

  return (
    <div
      className={`relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted transition-colors hover:border-foreground/30 ${className ?? ''}`}
      onClick={() => fileInputRef.current?.click()}>
      {preview
        ? (<Image src={preview} alt="preview" fill className="object-cover" />)
        : (<div className="flex flex-col items-center gap-2 text-muted-foreground">
            <UploadIcon className="size-6" />
            <span className="text-xs">{placeholder}</span>
          </div>)
      }
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60">
          <Loader2 className="size-6 animate-spin" />
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
})
