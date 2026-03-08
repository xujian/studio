import React from 'react'
import type { MDXComponents } from 'mdx/types'
import { ImageText } from './magazine/image-text'
import { ImagePair } from './magazine/image-pair'
import { InsetImage } from './magazine/inset-image'
import { PullQuote } from './magazine/pull-quote'

export const mdxComponents: MDXComponents = {
  h1: ({ children }) => (
    <h1 className="font-playfair text-3xl font-bold mt-12 mb-5 leading-tight">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-playfair text-2xl font-semibold mt-10 mb-4 leading-snug">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-playfair text-xl font-semibold mt-8 mb-3">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-[1.0625rem] leading-[1.85] mb-6 text-foreground/85">{children}</p>
  ),
  a: ({ href, children }) => (
    <a href={href} className="underline underline-offset-4 hover:text-primary transition-colors">
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-6 mb-6 space-y-2">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 mb-6 space-y-2">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-[1.0625rem] leading-[1.8]">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic">{children}</em>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-foreground/20 pl-6 my-8 text-muted-foreground italic text-lg leading-relaxed">
      {children}
    </blockquote>
  ),
  hr: () => (
    <hr className="my-12 border-border" />
  ),
  code: ({ children }) => (
    <code className="bg-muted rounded px-1.5 py-0.5 text-sm font-mono">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="bg-muted rounded-lg p-4 overflow-x-auto my-6 text-sm font-mono">{children}</pre>
  ),
  img: ({ src, alt }) => (
    <figure className="my-10">
      <img
        src={src}
        alt={alt ?? ''}
        className="w-full object-cover"
      />
      {alt && (
        <figcaption className="mt-3 text-xs tracking-wide text-muted-foreground italic text-center px-6">
          {alt}
        </figcaption>
      )}
    </figure>
  ),
  ImageText,
  ImagePair,
  InsetImage,
  PullQuote,
}
