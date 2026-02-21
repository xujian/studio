import { MomentModal } from '@/components/moment-modal'
import { fetchMoment } from '@/lib/moments'

export default async function InterceptedMomentPage({
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
    <MomentModal
      moment={moment}
      initialPhotoId={photo || moment.photos[0]?.id}
      readOnly={readOnly}
      author={author}
    />
  )
}
