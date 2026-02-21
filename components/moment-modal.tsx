'use client'

import { useRouter } from 'next/navigation'
import { MomentView } from '@/components/moment-view'
import type { MomentWithPhotos } from '@/lib/types'

interface MomentModalProps {
  moment: MomentWithPhotos
  initialPhotoId: string
  readOnly?: boolean
  author?: { id: string; name: string | null; avatar: string | null }
}

export function MomentModal({ moment, initialPhotoId, readOnly, author }: MomentModalProps) {
  const router = useRouter()

  return (
    <MomentView
      moment={moment}
      initialPhotoId={initialPhotoId}
      onClose={() => router.back()}
      readOnly={readOnly}
      author={author}
    />
  )
}
