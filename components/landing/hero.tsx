import Image from 'next/image'
import { storageUrl } from '@/lib/utils'
import { CtaButton } from './cta-button'

const PORTRAITS = ['hero-1', 'hero-2', 'hero-3', 'hero-4', 'hero-5']

export const Hero = () => {
  return (
    <section
      aria-label="Hero"
      className="hero relative flex flex-col left-1/2 h-[calc(100vh-8rem)] w-screen max-w-480 -translate-x-1/2">
      {/* <div className="absolute w-full inset-0 h-full bg-cover bg-center" style={{
        backgroundImage: `url(${storageUrl('landing/hero.jpg')})`
      }}/> */}
      <div className="felx-1 h-4/5 grid grid-cols-5 gap-1 px-2">
        {PORTRAITS.map((name, index) => (
          <div
            key={name}
            className="relative overflow-hidden rounded-4xl">
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
      <div className="flex flex-0 w-full items-stretch justify-center gap-6 px-4 text-center">
        <h1
          className="flex-1 text-start font-bold leading-none"
          style={{ fontSize: 'clamp(3rem, 10vw, 6rem)', letterSpacing: '-0.03em' }}>
          Your Personal<br />Photo Studio
        </h1>
        <div className="flex flex-col flex-1">
          <div className="flex-1 flex items-center justify-end">
            <p className="text-lg">
              She was a feeling. Now she&apos;s a photograph
            </p>
          </div>
          <div className="flex-1 text-end">
            <CtaButton />
          </div>
        </div>
      </div>
    </section>
  )
}
