import { PostGrid } from '@/components/post-grid'

export default function CommunityPage() {
  return (
    <section className="flex w-full flex-col px-16 pb-16 pt-2">
      <h1 className="mb-6 text-2xl font-semibold">Trending Moments by People</h1>
      <PostGrid />
    </section>
  )
}
