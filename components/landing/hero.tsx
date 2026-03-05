import { storageUrl } from '@/lib/utils'
import { CtaButton } from './cta-button'

const PORTRAITS = ['hero-1', 'hero-2', 'hero-3', 'hero-4', 'hero-5']

export const Hero = () => {
  return (
    <section
      aria-label="Hero"
      className="relative left-1/2 h-[60vh] w-screen -translate-x-1/2 overflow-hidden">
      {/* <div className="absolute w-full inset-0 h-full bg-cover bg-center" style={{
        backgroundImage: `url(${storageUrl('landing/hero.jpg')})`
      }}/> */}
      <div className="absolute inset-0 grid grid-cols-5 gap-1 p-1">
        {PORTRAITS.map(name => (
          <div
            key={name}
            className="relative overflow-hidden rounded-xl">
            <img
              src={storageUrl(`landing/${name}.jpg`)}
              alt=""
              width={400}
              height={711}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-linear-to-b from-black/0 via-black/70 to-black/0" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-6 px-4 text-center">
        <h1
          className="font-playfair font-bold text-shadow-blue-900 leading-none"
          style={{ fontSize: 'clamp(3rem, 10vw, 6rem)', letterSpacing: '-0.03em' }}>
          Your Personal<br />Photo Studio
        </h1>
        <p className="max-w-md text-lg text-white/70">
          She was a feeling. Now she's a photograph.
        </p>
        <CtaButton size="lg" />
      </div>
    </section>
  )
}
