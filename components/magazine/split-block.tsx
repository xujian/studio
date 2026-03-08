export type SplitBlockProps = {
  image: string
  caption?: string
  children: React.ReactNode
}

export function SplitBlock({ image, caption, children }: SplitBlockProps) {
  return (
    <div className="grid grid-cols-2 gap-4 my-14 items-start">
      <figure className="sticky top-8 w-1/2">
        <img src={image} alt={caption ?? ''} className="w-full object-cover rounded-2xl" />
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
