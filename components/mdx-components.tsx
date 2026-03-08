import React from 'react'

type MdxComponents = Record<string, React.ComponentType<React.HTMLAttributes<HTMLElement> & { href?: string }>>

export const mdxComponents: MdxComponents = {
  h1: ({ children }) => (
    <h1 className="font-playfair text-3xl font-bold mt-8 mb-4">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-playfair text-2xl font-semibold mt-8 mb-3">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-playfair text-xl font-semibold mt-6 mb-2">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="leading-7 mb-4 text-foreground/90">{children}</p>
  ),
  a: ({ href, children }) => (
    <a href={href} className="underline underline-offset-4 hover:text-primary transition-colors">
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-7">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary/40 pl-4 italic my-4 text-muted-foreground">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-8 border-border" />,
  code: ({ children }) => (
    <code className="bg-muted rounded px-1.5 py-0.5 text-sm font-mono">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="bg-muted rounded-lg p-4 overflow-x-auto my-4 text-sm font-mono">
      {children}
    </pre>
  ),
}
