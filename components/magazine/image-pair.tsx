type Props = {
  leftSrc: string
  leftCaption?: string
  rightSrc: string
  rightCaption?: string
}

export function ImagePair({ leftSrc, leftCaption, rightSrc, rightCaption }: Props) {
  return (
    <div className="grid grid-cols-2 gap-6 my-14">
      <figure>
        <img src={leftSrc} alt={leftCaption ?? ''} className="w-full object-cover" />
        {leftCaption && (
          <figcaption className="mt-2 text-xs tracking-wide text-muted-foreground italic">
            {leftCaption}
          </figcaption>
        )}
      </figure>
      <figure>
        <img src={rightSrc} alt={rightCaption ?? ''} className="w-full object-cover" />
        {rightCaption && (
          <figcaption className="mt-2 text-xs tracking-wide text-muted-foreground italic">
            {rightCaption}
          </figcaption>
        )}
      </figure>
    </div>
  )
}
