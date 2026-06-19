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
    // Break out of the root <main className="container"> width cap so the
    // moment view can span a wider canvas, then re-center with its own max-width.
    <div className="relative left-1/2 w-screen -translate-x-1/2">
      <div className="mx-auto h-[calc(100vh-6rem)] max-w-640 px-4">
        <MomentView
          moment={moment}
          initialPhotoId={photo || moment.photos[0]?.id}
          readOnly={readOnly}
          author={author}
        />
      </div>
    </div>
  )
}
