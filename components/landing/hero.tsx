import { CtaButton } from './cta-button'

const PORTRAITS = [
  { name: 'hero-1', offset: '0px' },
  { name: 'hero-2', offset: '40px' },
  { name: 'hero-3', offset: '0px' },
  { name: 'hero-4', offset: '60px' },
  { name: 'hero-5', offset: '20px' },
]

export const Hero = () => {
  return (
    <section
      aria-label="Hero"
      className="relative left-1/2 h-[90vh] w-screen -translate-x-1/2 overflow-hidden">
      <div className="absolute inset-0 grid grid-cols-5 gap-1 p-1">
        {PORTRAITS.map(p => (
          <div
            key={p.name}
            className="relative overflow-hidden rounded-xl">
            <img
              src={`https://rhxlulctluazrpqzooya.supabase.co/storage/v1/object/public/landing//${p.name}.jpg`}
              alt=""
              width={400}
              height={711}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-6 px-4 text-center">
        <h1 className="text-5xl leading-tight font-bold tracking-tight text-white md:text-7xl">
          Your Personal Photo Studio
        </h1>
        <p className="max-w-md text-lg text-white/70">
          Generate stunning portraits in seconds.
        </p>
        <CtaButton size="lg" />
      </div>
    </section>
  )
}
