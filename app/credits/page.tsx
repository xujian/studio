import { redirect } from 'next/navigation'
import { Sparkle, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CREDIT_PACKAGES } from '@/lib/constants'
import { cn } from '@/lib/utils'

export default async function CreditsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', session.user.id)
    .single()

  const currentCredits = profile?.credits ?? 0

  return (
    <section className="flex w-full flex-col items-center px-8 pb-16 pt-2">
      <div className="w-full max-w-2xl">
        <div className="mb-10">
          <h1 className="text-2xl font-semibold">Buy Credits</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            Current balance:
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Sparkle className="size-3.5 text-yellow-400" />
              {currentCredits}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CREDIT_PACKAGES.map((pkg) => {
            const isPopular = pkg.id === 'popular'
            return (
              <div
                key={pkg.id}
                className={cn(
                  'relative flex flex-col rounded-2xl border p-6 transition-colors',
                  isPopular
                    ? 'border-primary bg-primary/5 ring-2 ring-primary'
                    : 'border-border bg-card hover:border-primary/50'
                )}>
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                    Most Popular
                  </span>
                )}

                <div className="mb-4">
                  <p className="text-sm font-medium text-muted-foreground">{pkg.label}</p>
                  <p className="mt-1 flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                      ${(pkg.price / 100).toFixed(0)}
                    </span>
                    <span className="text-sm text-muted-foreground">USD</span>
                  </p>
                </div>

                <div className="mb-6 flex items-center gap-1.5 text-sm">
                  <Sparkle className="size-4 text-yellow-400" />
                  <span className="font-semibold">{pkg.credits.toLocaleString()}</span>
                  <span className="text-muted-foreground">credits</span>
                </div>

                <form action="/api/credits/checkout" method="POST" className="mt-auto">
                  <input type="hidden" name="packageId" value={pkg.id} />
                  <button
                    type="submit"
                    className={cn(
                      'flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                      isPopular
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    )}>
                    <Zap className="size-4" />
                    Buy Now
                  </button>
                </form>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
