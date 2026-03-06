import type { Metadata } from 'next'
import { MomentView } from '@/components/moment-view'
import { fetchMoment } from '@/lib/moments'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function MomentPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ photo?: string }>
}) {
  const { id } = await params
  const { photo } = await searchParams
  const { moment, readOnly, author } = await fetchMoment(id)

  return (
    <div className="h-[calc(100vh-6rem)]">
      <MomentView
        moment={moment}
        initialPhotoId={photo || moment.photos[0]?.id}
        readOnly={readOnly}
        author={author}
      />
    </div>
  )
}
