import Image from 'next/image'
import { storageUrl } from '@/lib/utils'
import { CtaButton } from './cta-button'

const SCREENSHOT_URL = storageUrl('landing/demo.png')

export const StudioDemo = () => {
  return (
    <section aria-label="Studio demo" className="flex flex-col items-center gap-8 px-4">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          The Studio
        </p>
        <h2 className="font-playfair text-3xl md:text-4xl font-bold">
          Everything in one place.
        </h2>
        <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
          Pick a face, layer your Mixins, describe the mood — and generate your portrait in seconds.
        </p>
      </div>

      {/* Screenshot frame */}
      <div className="w-full max-w-5xl rounded-2xl overflow-hidden">
        <Image
          src={SCREENSHOT_URL}
          alt="Kanojo Studio interface showing the Producer with face picker, mixin tabs, and prompt input"
          width={1307}
          height={900}
          className="w-full object-cover object-top"
          sizes="(max-width: 1024px) 100vw, 1024px"
          priority
        />
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-muted-foreground">Ready to try it?</p>
        <CtaButton size="lg" />
      </div>
    </section>
  )
}
