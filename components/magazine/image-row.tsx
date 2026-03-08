type Item = {
  src: string
  caption?: string
}

type Props = {
  items: Item[]
}

export function ImageRow({ items }: Props) {
  return (
    <div className="flex gap-6 my-14">
      {items.map((item, i) => (
        <figure key={i} className="flex-1 min-w-0">
          <img src={item.src} alt={item.caption ?? ''} className="w-full object-cover" />
          {item.caption && (
            <figcaption className="mt-2 text-xs tracking-wide text-muted-foreground italic">
              {item.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  )
}
