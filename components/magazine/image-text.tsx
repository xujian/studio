type Props = {
  src: string
  caption?: string
  children: React.ReactNode
}

export function ImageText({ src, caption, children }: Props) {
  return (
    <div className="grid grid-cols-[2fr_3fr] gap-10 my-14 items-start">
      <figure className="sticky top-8">
        <img src={src} alt={caption ?? ''} className="w-full object-cover" />
        {caption && (
          <figcaption className="mt-2 text-xs tracking-wide text-muted-foreground italic">
            {caption}
          </figcaption>
        )}
      </figure>
      <div>{children}</div>
    </div>
  )
}
