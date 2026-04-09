import Image from 'next/image'
import { storageUrl } from '@/lib/utils'
import { CtaButton } from './cta-button'

const PORTRAITS = ['hero-1', 'hero-2', 'hero-3', 'hero-4', 'hero-5']

export const Hero = () => {
  return (
    <section
      aria-label="Hero"
      className="hero relative left-1/2 h-[60vh] w-screen max-w-480 -translate-x-1/2 overflow-hidden">
      {/* <div className="absolute w-full inset-0 h-full bg-cover bg-center" style={{
        backgroundImage: `url(${storageUrl('landing/hero.jpg')})`
      }}/> */}
      <div className="absolute inset-0 grid grid-cols-5 gap-2 px-2">
        {PORTRAITS.map((name, index) => (
          <div
            key={name}
            className="relative overflow-hidden rounded-xl">
            <Image
              src={storageUrl(`landing/${name}.jpg`)}
              alt={`AI-generated portrait photo ${index + 1}`}
              fill
              className="object-cover"
              sizes="20vw"
              priority={index < 2}
            />
          </div>
        ))}
      </div>
      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-linear-to-b from-black/0 via-black/55 to-black/0" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-6 px-4 text-center">
        <h1
          className="font-bold text-shadow-blue-900 leading-none"
          style={{ fontSize: 'clamp(3rem, 10vw, 6rem)', letterSpacing: '-0.03em' }}>
          Your Personal<br />Photo Studio
        </h1>
        <p className="max-w-md text-lg text-white/70">
          She was a feeling. Now she&apos;s a photograph.
        </p>
        <CtaButton />
      </div>
    </section>
  )
}
