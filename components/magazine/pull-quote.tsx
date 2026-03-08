type Props = {
  children: React.ReactNode
}

export function PullQuote({ children }: Props) {
  return (
    <blockquote className="my-12 mx-auto max-w-2xl px-6 py-8 border-y border-foreground/15 text-center">
      <p className="font-playfair text-2xl italic leading-relaxed text-foreground/80">
        {children}
      </p>
    </blockquote>
  )
}
