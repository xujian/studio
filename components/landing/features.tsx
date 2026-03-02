import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, ShoppingBag, Images } from 'lucide-react'

const FEATURES = [
  {
    icon: Sparkles,
    title: 'The Studio',
    description: 'Combine a face, Mixins, and a prompt. Generate stunning 9:16 portraits in seconds. Iterate endlessly.',
    color: 'text-violet-400 bg-violet-400/10',
  },
  {
    icon: ShoppingBag,
    title: 'The Store',
    description: 'Browse faces, outfits, scenes, and more. Many free. New drops regularly. Build your collection.',
    color: 'text-pink-400 bg-pink-400/10',
  },
  {
    icon: Images,
    title: 'Your Moments',
    description: 'Every generation saved. Revisit, tweak, and generate variations anytime. Your creative history.',
    color: 'text-sky-400 bg-sky-400/10',
  },
]

export const Features = () => {
  return (
    <section aria-label="Features" className="flex flex-col items-center gap-12 px-4">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Everything you need
        </p>
        <h2 className="font-playfair text-3xl md:text-4xl font-bold">
          Built for one thing.<br />Done perfectly.
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {FEATURES.map((f) => (
          <Card key={f.title} className="flex flex-col gap-6 p-6 glass elevation-2 glow-primary-hover transition-all">
            <CardContent className="p-0 flex flex-col gap-4">
              <div className={`icon w-12 h-12 rounded-2xl ${f.color}`}>
                <f.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
