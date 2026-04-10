import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}

/**
 * Derive photo public URL from IDs.
 * Storage path: {userId}/{momentId}/{photoId}.jpg in the `photos` bucket.
 */
export const photoUrl = (userId: string, momentId: string, photoId: string) =>
  [
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}`,
    '/storage/v1/object/public/photos/',
    `${userId}/${momentId}/${photoId}.jpg`
  ].join('')

export const uploadUrl = (userIdOrFilename: string, filename?: string) =>
  [
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}`,
    'storage/v1/object/public/uploads',
    filename ? `${userIdOrFilename}/${filename}` : userIdOrFilename
  ].join('/')

export const assetUrl = (path: string) =>
  path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/assets/${path.replace(/^\//, '')}`
    : ''

export const storageUrl = (path: string) =>
  [
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}`,
    '/storage/v1/object/public/',
    `${path}`
  ].join('')

export const removeAssetImage = async (path: string) => {
  const response = await fetch('/api/assets/image', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  })
  return response.ok
}


export const random = (bytes = 8) => {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
}

