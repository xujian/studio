type Props = {
  src: string
  caption?: string
  side?: 'left' | 'right'
}

export function InsetImage({ src, caption, side = 'right' }: Props) {
  return (
    <figure
      className={[
        'my-4 w-2/5',
        side === 'right' ? 'float-right ml-8 mb-4' : 'float-left mr-8 mb-4',
      ].join(' ')}
    >
      <img src={src} alt={caption ?? ''} className="w-full object-cover" />
      {caption && (
        <figcaption className="mt-2 text-xs tracking-wide text-muted-foreground italic">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
