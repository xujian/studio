import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getAllPosts } from '@/lib/magazine'

export const metadata: Metadata = {
  title: 'Magazine — Kanojo Studio',
  description: 'Essays on light, beauty, and the art of the portrait.',
}

export default function MagazinePage() {
  const posts = getAllPosts()
  const [hero, ...rest] = posts

  return (
    <div className="page-body">
      {/* Masthead */}
      <div className="mx-auto max-w-5xl px-6 pt-20 pb-12 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4">
          Kanojo Studio
        </p>
        <h1 className="text-6xl sm:text-7xl font-bold">Magazine</h1>
        <p className="mt-5 text-muted-foreground italic text-lg max-w-md mx-auto">
          Essays on light, beauty, and the art of the portrait.
        </p>
        <div className="mt-12 border-t border-border" />
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-muted-foreground py-24">
          No posts yet. Check back soon.
        </p>
      ) : (
        <div className="mx-auto max-w-5xl px-6 pb-24">
          {/* Hero post */}
          {hero && (
            <Link href={`/magazine/${hero.slug}`} className="group block mb-20">
              {hero.coverImage && (
                <div className="relative w-full h-[55vh] overflow-hidden mb-8">
                  <Image
                    src={hero.coverImage}
                    alt={hero.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 83vw, 1024px"
                    priority
                  />
                </div>
              )}
              <div className="max-w-2xl mx-auto text-center">
                <time
                  dateTime={hero.date}
                  className="text-xs tracking-[0.2em] uppercase text-muted-foreground"
                >
                  {new Date(hero.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                <h2 className="text-4xl sm:text-5xl font-bold mt-3 mb-4 leading-tight group-hover:opacity-70 transition-opacity">
                  {hero.title}
                </h2>
                <p className="text-muted-foreground italic text-lg leading-relaxed">
                  {hero.excerpt}
                </p>
              </div>
            </Link>
          )}

          {/* Remaining posts */}
          {rest.length > 0 && (
            <>
              <div className="border-t border-border mb-14" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-14">
                {rest.map(post => (
                  <Link
                    key={post.slug}
                    href={`/magazine/${post.slug}`}
                    className="group block"
                  >
                    {post.coverImage && (
                      <div className="relative w-full aspect-[4/3] overflow-hidden mb-5">
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 480px"
                        />
                      </div>
                    )}
                    <time
                      dateTime={post.date}
                      className="text-xs tracking-[0.2em] uppercase text-muted-foreground"
                    >
                      {new Date(post.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                    <h2 className="text-2xl font-bold mt-2 mb-3 leading-snug group-hover:opacity-70 transition-opacity">
                      {post.title}
                    </h2>
                    <p className="text-muted-foreground italic text-sm leading-relaxed">
                      {post.excerpt}
                    </p>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
