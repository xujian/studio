import { createClient } from '@/lib/supabase/server'
import { PostCard } from '@/components/post-card'
import type { Post } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Community — AI Portrait Gallery',
  description:
    'Browse AI portrait photos created by the Kanojo Studio community. Get inspired and start creating your own.',
  alternates: {
    canonical: 'https://kanojostudio.com/community',
  },
}

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
        <div className="flex flex-col gap-10">
          {sections.map(section => (
            <section key={section.title} className="flex flex-col gap-4">
              <h2 className="my-0 text-lg font-semibold">{section.title}</h2>
              <div className="scrollbar-none -mx-16 flex gap-4 overflow-x-auto px-16 pb-4">
                {section.posts.map(post => (
                  <div key={post.id} className="w-48 shrink-0 md:w-56">
                    <PostCard
                      post={post}
                      href={`/moments/${post.moment.id}?photo=${post.moment.photos[0]?.id}`}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  )
}
