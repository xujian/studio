import { createClient } from '@/lib/supabase/server'
import { PostGrid } from '@/components/post-grid'
import type { Post } from '@/lib/types'

const PAGE_SIZE = 20

export default async function CommunityPage() {
  const supabase = await createClient()

  const {
    data: { session }
  } = await supabase.auth.getSession()

  const userId = session?.user?.id ?? '00000000-0000-0000-0000-000000000000'

  const { data } = await supabase.rpc('get_posts', {
    user_uuid: userId,
    page_limit: PAGE_SIZE,
    page_offset: 0
  })

  const allPosts = ((data || []) as Post[]).filter(p => p.moment.photos.length > 0)

  const popular = [...allPosts]
    .sort((a, b) => b.likes_count - a.likes_count)
    .filter(p => p.likes_count > 0)

  const recent = [...allPosts]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const sections = popular.length > 0
    ? [
        { title: 'Popular', posts: popular },
        { title: 'Recent', posts: recent }
      ]
    : [{ title: 'Recent', posts: recent }]

  return (
    <section className="flex w-full flex-col px-16 pb-16 pt-2">
      <h1 className="mb-8 text-2xl font-semibold">Community</h1>
      {allPosts.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          No posts yet. Be the first to share a moment!
        </div>
      ) : (
        <PostGrid initialPosts={allPosts} sections={sections} />
      )}
    </section>
  )
}
