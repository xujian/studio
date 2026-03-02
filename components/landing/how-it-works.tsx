import { Card, CardContent } from '@/components/ui/card'
import { ShoppingBag, Layers, Sparkles } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    icon: ShoppingBag,
    title: 'Pick a face',
    description: 'Browse the Store, claim a face you love — or upload your own. Many faces are free.',
  },
  {
    number: '02',
    icon: Layers,
    title: 'Mix your style',
    description: 'Layer Mixins on top: outfit, makeup, hair, scene, lighting. Your vision, your way.',
  },
  {
    number: '03',
    icon: Sparkles,
    title: 'Generate',
    description: 'Your 9:16 portrait is ready in seconds. Saved to your Moments, ready to iterate.',
  },
]

export const HowItWorks = () => {
  return (
    <section aria-label="How it works" className="flex flex-col items-center gap-12 px-4">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          How it works
        </p>
        <h2 className="font-playfair text-3xl md:text-4xl font-bold">
          Three steps to your perfect portrait.
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {STEPS.map((step) => (
          <Card key={step.number} className="flex flex-col gap-4 p-6 glass elevation-2">
            <CardContent className="p-0 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black text-muted-foreground/30">{step.number}</span>
                <div className="icon bg-primary/10 text-primary">
                  <step.icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
