import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { notFound } from 'next/navigation'
import { mdxComponents } from '@/components/mdx-components'
import { getAllSlugs, getPostBySlug } from '@/lib/magazine'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : []
    }
  }
}

export default async function MagazinePostPage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) notFound()

  const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <article className="magazine-article">
      <div className="cover-layout mb-10 flex items-center h-100vh">
        {post.coverImage && (
          <div className="h-[75vh] w-full overflow-hidden">
            <img
              src={post.coverImage}
              alt={post.title}
              className="h-full w-full object-cover rounded-2xl"
            />
          </div>
        )}
        {/* Header */}
        <div className="mx-auto max-w-2xl px-6 pt-14 pb-10 text-center">
          <time
            dateTime={post.date}
            className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
            {formattedDate}
          </time>
          <h1 className="font-playfair mt-4 mb-6 text-4xl leading-tight font-bold sm:text-5xl">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-lg leading-relaxed text-muted-foreground italic">
              {post.excerpt}
            </p>
          )}
        </div>
      </div>
      {/* Body */}
      <div className="mx-auto max-w-5xl px-6 pb-24">
        <div className="prose-article">
          <MDXRemote source={post.content} components={mdxComponents} />
        </div>
      </div>
    </article>
  )
}
