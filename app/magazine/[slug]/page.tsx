import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllSlugs, getPostBySlug } from '@/lib/magazine'
import { mdxComponents } from '@/components/mdx-components'

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
      images: post.coverImage ? [post.coverImage] : [],
    },
  }
}

export default async function MagazinePostPage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) notFound()

  const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <article>
      {/* Full-bleed hero */}
      {post.coverImage && (
        <div className="w-full h-[75vh] overflow-hidden">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Header */}
      <div className="mx-auto max-w-2xl px-6 pt-14 pb-10 text-center">
        <time
          dateTime={post.date}
          className="text-xs tracking-[0.2em] uppercase text-muted-foreground"
        >
          {formattedDate}
        </time>
        <h1 className="font-playfair text-4xl sm:text-5xl font-bold mt-4 mb-6 leading-tight">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="text-lg text-muted-foreground italic leading-relaxed">
            {post.excerpt}
          </p>
        )}
        <div className="mt-10 border-t border-border" />
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
