import { cn, storageUrl } from '@/lib/utils'
import { CtaButton } from './cta-button'

/**
 * distinctive features of Kanojo Studio
 */
const SECTIONS = [
  {
    label: 'Imagination',
    headline: 'She belongs in every world you imagine.',
    sub: "Upload any image. The light, the mood, the world — she's already there.",
    flip: false,
  },
  {
    label: 'Emotion',
    headline: 'Photographs that feel like something.',
    sub: 'Soft morning light. Bold confidence. Melancholic dusk. Set the mood — the portrait builds itself.',
    flip: true,
    image: 'feature-moods.jpg'
  },
  {
    label: 'Scene Worlds',
    headline: 'Not a backdrop. A world.',
    sub: 'A rainy Parisian café. A Tokyo street after midnight. A sunlit bedroom at dawn. She steps inside.',
    flip: false,
    image: 'feature-scenes.jpg'
  },
  {
    label: 'Looks',
    headline: 'A complete look. One tap.',
    sub: 'Hair, outfit, lighting, scene — curated to work as one. Browse by feel, not by category.',
    flip: true,
    image: 'feature-looks.jpg'
  },
  {
    label: 'The Shoot',
    headline: 'Not one lucky frame. A shoot.',
    sub: 'Every session gives you a set of portraits — different angles, expressions, small variations. The way real photography works.',
    flip: false
  }
]

export const Features = () => {
  return (
    <section aria-label="Features" className="flex flex-col gap-32 px-4">
      {SECTIONS.map(s => (
        <div
          key={s.label}
          className={cn(
            `mx-auto flex w-full max-w-5xl flex-col items-center`,
            `gap-12 md:flex-row`,
            'bg-cover bg-center',
            s.flip ? 'md:flex-row-reverse' : ''
          )}
          style={s.image ? { backgroundImage: `url(${storageUrl(`landing/${s.image}`)})` } : undefined}>
          {/* Text */}
          <div className="flex flex-1 flex-col gap-6">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              {s.label}
            </p>
            <h2
              className="font-playfair leading-tight font-bold"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
              {s.headline}
            </h2>
            <p className="max-w-sm text-lg leading-relaxed text-muted-foreground">
              {s.sub}
            </p>
            <div>
              <CtaButton size="sm" />
            </div>
          </div>
          {/* empty Placeholder */}
          <div className="flex w-full flex-1 justify-center">
          </div>
        </div>
      ))}
    </section>
  )
}
