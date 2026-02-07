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
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${userId}/${momentId}/${photoId}.jpg`
