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

  return (
    <article className="page mx-auto py-16">
      {post.coverImage && (
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-full h-72 object-cover rounded-xl mb-8"
        />
      )}
      <time dateTime={post.date} className="text-sm text-muted-foreground">
        {new Date(post.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </time>
      <h1 className="font-playfair text-4xl font-bold mt-2 mb-8">{post.title}</h1>
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <MDXRemote source={post.content} components={mdxComponents} />
      </div>
    </article>
  )
}
