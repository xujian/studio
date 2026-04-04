'use client'

import * as React from 'react'
import { forwardRef, useImperativeHandle, useState } from 'react'
import { compressImage } from '@/lib/compress-image'
import { useUpload } from '@/hooks/use-upload'
import { Dropzone } from './dropzone'

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
  placeholder?: string
  className?: string
  /** Controlled image URL to display */
  value?: string
  /** compress the image? image not compressed for "face" */
  compress?: boolean
  /** Called with the final file (after optional compression) before upload starts */
  onBeforeUpload?: (file: File) => void
} & Omit<React.ComponentProps<'div'>, 'onDrop'>

export const Upload = forwardRef<UploadHandle, UploadProps>(function Upload(
  {
    path,
    onComplete,
    onClear,
    onError,
    placeholder,
    className,
    value,
    compress = true,
    onBeforeUpload,
    ...rest
  },
  ref
) {
  const { upload, uploading } = useUpload({ path })
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  const processFile = async (file: File) => {
    const compressed = compress ? await compressImage(file) : file
    onBeforeUpload?.(compressed)
    setLocalPreview(URL.createObjectURL(compressed))
    upload(compressed, {
      onSuccess: ({ storagePath }) => onComplete(storagePath),
      onError: () => {
        setLocalPreview(null)
        onError?.()
      }
    })
  }

  useImperativeHandle(ref, () => ({ upload: processFile }))

  return (
    <Dropzone
      onFile={processFile}
      value={value || localPreview || undefined}
      onClear={() => {
        setLocalPreview(null)
        onClear?.()
      }}
      uploading={uploading}
      placeholder={placeholder}
      className={className}
      {...rest}
    />
  )
})
