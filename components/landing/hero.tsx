import { CtaButton } from './cta-button'

const PORTRAITS = [
  { seed: 'a1', offset: '0px' },
  { seed: 'b2', offset: '40px' },
  { seed: 'c3', offset: '0px' },
  { seed: 'd4', offset: '60px' },
  { seed: 'e5', offset: '20px' },
  { seed: 'f6', offset: '0px' },
  { seed: 'g7', offset: '50px' },
  { seed: 'h8', offset: '10px' },
  { seed: 'i9', offset: '30px' },
  { seed: 'j10', offset: '0px' },
]

export const Hero = () => {
  return (
    <section className="relative w-screen left-1/2 -translate-x-1/2 -mt-8 overflow-hidden h-[90vh]">
      {/* Portrait mosaic */}
      <div className="absolute inset-0 grid grid-cols-5 gap-2 p-2 scale-105">
        {PORTRAITS.map((p) => (
          <div
            key={p.seed}
            className="relative rounded-xl overflow-hidden"
            style={{ marginTop: p.offset }}
          >
            <img
              src={`https://picsum.photos/seed/${p.seed}/400/711`}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Radial gradient — lighter in center */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,transparent,rgba(0,0,0,0.4))]" />

      {/* Bottom fade to page background */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-6 text-center px-4">
        <div className="logo w-10 h-10 text-white" aria-hidden />
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
          Your personal<br />portrait studio.
        </h1>
        <p className="text-lg text-white/70 max-w-md">
          Pick a face. Set the vibe. Generate stunning 9:16 portraits in seconds.
        </p>
        <CtaButton size="lg" />
      </div>
    </section>
  )
}
