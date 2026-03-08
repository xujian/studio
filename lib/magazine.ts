import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const MAGAZINE_DIR = path.join(process.cwd(), 'content/magazine')

export type PostMeta = {
  slug: string
  title: string
  date: string
  excerpt: string
  coverImage?: string
}

export type Post = PostMeta & {
  content: string
}

function parsePost(filename: string): PostMeta | null {
  const slug = filename.replace(/\.mdx$/, '')
  const filePath = path.join(MAGAZINE_DIR, filename)
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data } = matter(raw)

  if (!data.published) return null

  return {
    slug,
    title: data.title as string,
    date: data.date as string,
    excerpt: data.excerpt as string,
    coverImage: data.coverImage as string | undefined,
  }
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(MAGAZINE_DIR)) return []

  return fs
    .readdirSync(MAGAZINE_DIR)
    .filter(f => f.endsWith('.mdx'))
    .map(parsePost)
    .filter((p): p is PostMeta => p !== null)
    .sort((a, b) => (a.date > b.date ? -1 : 1))
}

export function getAllSlugs(): string[] {
  return getAllPosts().map(p => p.slug)
}

export function getPostBySlug(slug: string): Post | null {
  const filePath = path.join(MAGAZINE_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)

  if (!data.published) return null

  return {
    slug,
    title: data.title as string,
    date: data.date as string,
    excerpt: data.excerpt as string,
    coverImage: data.coverImage as string | undefined,
    content,
  }
}
