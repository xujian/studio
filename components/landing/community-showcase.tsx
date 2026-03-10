import Image from 'next/image'
import { CtaButton } from './cta-button'

const SHOWCASE_PORTRAITS = [
  'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'p12',
]

export const CommunityShowcase = () => {
  return (
    <section aria-label="Community showcase" className="flex flex-col items-center gap-12 px-4">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Made with Kanojo Studio
        </p>
        <h2 className="font-playfair text-3xl md:text-4xl font-bold">
          See what&apos;s possible.
        </h2>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 gap-2 w-full max-w-4xl">
        {SHOWCASE_PORTRAITS.map((seed) => (
          <div
            key={seed}
            className="relative aspect-[9/16] rounded-xl overflow-hidden group"
          >
            <Image
              src={`https://picsum.photos/seed/${seed}/400/711`}
              alt=""
              fill
              loading="lazy"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 33vw, 25vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4 pt-8">
        <p className="text-xl font-semibold">Ready to create yours?</p>
        <CtaButton />
      </div>
    </section>
  )
}
