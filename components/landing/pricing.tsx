import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { CtaButton } from './cta-button'
import { Check } from 'lucide-react'

const PLANS = [
  {
    id: 'basic',
    label: 'Basic',
    price: 9,
    credits: 100,
    description: 'For casual creators',
    features: ['100 credits / month', 'Access to Store', 'Unlimited Moments', 'Email support'],
    popular: false,
  },
  {
    id: 'pro',
    label: 'Pro',
    price: 19,
    credits: 250,
    description: 'For regular users',
    features: ['250 credits / month', 'Access to Store', 'Unlimited Moments', 'Priority generation', 'Priority support'],
    popular: true,
  },
  {
    id: 'max',
    label: 'Max',
    price: 39,
    credits: 600,
    description: 'For power users',
    features: ['600 credits / month', 'Access to Store', 'Unlimited Moments', 'Priority generation', 'Priority support'],
    popular: false,
  },
]

export const Pricing = () => {
  return (
    <section aria-label="Pricing" className="flex flex-col items-center gap-12 px-4">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Simple pricing
        </p>
        <h2 className="text-3xl md:text-4xl font-bold">
          Start free. Upgrade when you&apos;re ready.
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl items-center">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              'relative rounded-2xl p-0 transition-all',
              plan.popular && 'border-primary bg-primary/5 ring-2 ring-primary scale-105 elevation-3'
            )}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                Most Popular
              </span>
            )}
            <CardTitle className="p-6 pb-2">{plan.label}</CardTitle>
            <CardContent className="p-6 pt-2 flex flex-col gap-4 flex-1">
              <div>
                <span className="text-4xl font-black">${plan.price}</span>
                <span className="text-muted-foreground text-sm"> / month</span>
              </div>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              <ul className="flex flex-col gap-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <CtaButton />
            </CardFooter>
          </Card>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        Free tier included — no credit card required. Credit packs available for all plans.
      </p>
    </section>
  )
}
