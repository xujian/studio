import { redirect } from 'next/navigation'
import { Sparkle, Zap, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CREDIT_PACKAGES, SUBSCRIPTION_PLANS } from '@/lib/constants'
import type { Subscription } from '@/lib/types'
import { cn } from '@/lib/utils'

export default async function CreditsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('credits, subscription_tier')
    .eq('id', session.user.id)
    .single()

  const { data: subscription } = await admin
    .from('subscriptions')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .maybeSingle() as { data: Subscription | null }

  const currentCredits = profile?.credits ?? 0
  const currentTier = profile?.subscription_tier ?? 'free'
  const hasSubscription = !!subscription

  return (
    <section className="flex w-full flex-col items-center px-8 pb-16 pt-2">
      <div className="w-full max-w-3xl space-y-12">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold">Plans & Credits</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            Current balance:
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Sparkle className="size-3.5 text-yellow-400" />
              {currentCredits}
            </span>
          </p>
        </div>

        {/* Subscription Plans */}
        <div>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Monthly Plans
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isCurrentPlan = currentTier === plan.id
              const isPopular = 'popular' in plan && plan.popular

              return (
                <div
                  key={plan.id}
                  className={cn(
                    'relative flex flex-col rounded-2xl border p-6 transition-colors',
                    isCurrentPlan
                      ? 'border-green-500 ring-2 ring-green-500'
                      : isPopular
                        ? 'border-primary bg-primary/5 ring-2 ring-primary'
                        : 'border-border bg-card hover:border-primary/50'
                  )}>
                  {isCurrentPlan && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-3 py-0.5 text-xs font-medium text-white">
                      Current Plan
                    </span>
                  )}
                  {!isCurrentPlan && isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                      Most Popular
                    </span>
                  )}

                  <div className="mb-4">
                    <p className="text-sm font-medium text-muted-foreground">{plan.label}</p>
                    <p className="mt-1 flex items-baseline gap-1">
                      <span className="text-3xl font-bold">${(plan.price / 100).toFixed(0)}</span>
                      <span className="text-sm text-muted-foreground">/mo</span>
                    </p>
                  </div>

                  <div className="mb-3 flex items-center gap-1.5 text-sm">
                    <Sparkle className="size-4 text-yellow-400" />
                    <span className="font-semibold">{plan.credits.toLocaleString()}</span>
                    <span className="text-muted-foreground">credits/mo</span>
                  </div>

                  <p className="mb-6 text-xs text-muted-foreground">{plan.description}</p>

                  {isCurrentPlan ? (
                    <form action="/api/credits/portal" method="POST" className="mt-auto">
                      <button
                        type="submit"
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80">
                        <CreditCard className="size-4" />
                        Manage Plan
                      </button>
                    </form>
                  ) : (
                    <form action="/api/credits/checkout" method="POST" className="mt-auto">
                      <input type="hidden" name="planId" value={plan.id} />
                      <button
                        type="submit"
                        className={cn(
                          'flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                          isPopular
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        )}>
                        <Zap className="size-4" />
                        {hasSubscription ? 'Switch Plan' : 'Subscribe'}
                      </button>
                    </form>
                  )}
                </div>
              )
            })}
          </div>

          {hasSubscription && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Credits reset on{' '}
              {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </p>
          )}
        </div>

        {/* One-time Credit Top-ups */}
        <div>
          <h2 className="mb-1 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Top-up Credits
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            One-time purchase. Credits never expire.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {CREDIT_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className="flex flex-col rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50">
                <div className="mb-4">
                  <p className="text-sm font-medium text-muted-foreground">{pkg.label}</p>
                  <p className="mt-1 flex items-baseline gap-1">
                    <span className="text-3xl font-bold">${(pkg.price / 100).toFixed(0)}</span>
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
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80">
                    <Zap className="size-4" />
                    Buy Now
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
