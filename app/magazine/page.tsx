import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts } from '@/lib/magazine'

export const metadata: Metadata = {
  title: 'Magazine',
  description: 'Tips, inspiration, and stories from the world of AI portrait photography.',
}

export default function MagazinePage() {
  const posts = getAllPosts()

  return (
    <div className="max-w-3xl mx-auto py-16 px-4">
      <h1 className="font-playfair text-4xl font-bold mb-2">Magazine</h1>
      <p className="text-muted-foreground mb-12">
        Tips, inspiration, and stories about AI portrait photography.
      </p>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">No posts yet. Check back soon.</p>
      ) : (
        <div className="flex flex-col gap-10">
          {posts.map(post => (
            <article key={post.slug}>
              <Link href={`/magazine/${post.slug}`} className="group block">
                {post.coverImage && (
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-56 object-cover rounded-xl mb-4"
                  />
                )}
                <time className="text-sm text-muted-foreground">
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                <h2 className="font-playfair text-2xl font-semibold mt-1 mb-2 group-hover:underline">
                  {post.title}
                </h2>
                <p className="text-muted-foreground">{post.excerpt}</p>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
