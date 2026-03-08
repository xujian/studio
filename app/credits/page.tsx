import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardTitle
} from '@/components/ui'
import { CREDIT_PACKAGES, SUBSCRIPTION_PLANS } from '@/lib/constants'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Subscription } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Zap, CreditCard } from 'lucide-react'
import { Credits } from '@/components/credits'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function CreditsPage() {
  const supabase = await createClient()
  const {
    data: { session }
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('credits, subscription_tier')
    .eq('id', session.user.id)
    .single()

  const { data: subscription } = (await admin
    .from('subscriptions')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .maybeSingle()) as { data: Subscription | null }

  const currentCredits = profile?.credits ?? 0
  const currentTier = profile?.subscription_tier ?? 'free'
  const hasSubscription = !!subscription

  return (
    <div className="page-body flex w-full flex-col items-center px-8 pt-2 pb-16">
      <div className="w-full max-w-3xl space-y-12">
        <div>
          <h1 className="text-2xl font-semibold">Buy Plans & Credits</h1>
          <Credits prefix="CURRENT BALANCE" className="bg-accent px-4" />
        </div>
        <div>
          <h2 className="mb-4 font-medium text-muted-foreground uppercase">
            Monthly Plans
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {SUBSCRIPTION_PLANS.map(plan => {
              const isCurrentPlan = currentTier === plan.id
              const isPopular = 'popular' in plan && plan.popular
              return (
                <Card
                  key={plan.id}
                  className={cn(
                    'relative flex flex-col rounded-2xl border p-0 aspect-square transition-colors',
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
                  <CardTitle className="p-4">{plan.label}</CardTitle>
                  <CardContent className="p-4 flex flex-col flex-1 gap-1 justify-between">
                    <p className="mt-1 flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        ${(plan.price / 100).toFixed(0)}
                      </span>
                      <span className="text-sm text-muted-foreground">/mo</span>
                    </p>
                    <p className="mt-1 flex items-baseline gap-1">
                      <Zap className="size-4 text-yellow-400" />
                      <span className="font-semibold">
                        {plan.credits.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">credits/mo</span>
                    </p>
                    <p className="text-sm text-muted-foreground">≈ {plan.credits} images</p>
                    <p className="mb-6 text-xs text-muted-foreground">
                      {plan.description}
                    </p>
                  </CardContent>
                  <CardFooter className="p-1">
                    {isCurrentPlan ? (
                      <form
                        action="/api/credits/portal"
                        method="POST"
                        className="w-full">
                        <Button
                          type="submit"
                          className="button bg-secondary text-secondary-foreground w-full">
                          <CreditCard className="size-4" />
                          Manage Plan
                        </Button>
                      </form>
                    ) : (
                      <form
                        action="/api/credits/checkout"
                        method="POST"
                        className="w-full">
                        <input type="hidden" name="planId" value={plan.id} />
                        <Button
                          type="submit"
                          className={cn(
                            'button bg-secondary text-secondary-foreground w-full',
                            isPopular
                              ? 'bg-secondary text-primary-foreground hover:bg-primary/90'
                              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                          )}>
                          <Zap className="size-4" />
                          {hasSubscription ? 'Switch Plan' : 'Subscribe'}
                        </Button>
                      </form>
                    )}
                  </CardFooter>
                </Card>
              )
            })}
          </div>

          {hasSubscription && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Credits reset on{' '}
              {new Date(subscription.current_period_end).toLocaleDateString(
                'en-US',
                {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                }
              )}
            </p>
          )}
        </div>

        {/* One-time Credit Top-ups */}
        <div>
          <h2 className="mb-1 font-medium text-muted-foreground uppercase">
            Credit Packs
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            One-time purchase. Credits never expire.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {CREDIT_PACKAGES.map(pkg => (
              <Card
                key={pkg.id}
                className="flex aspect-square flex-col rounded-2xl border border-border bg-card p-0 transition-colors hover:border-primary/50">
                <CardTitle className="p-4">{pkg.label}</CardTitle>
                <CardContent className="p-4">
                  <p className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      ${(pkg.price / 100).toFixed(0)}
                    </span>
                    <span className="text-sm text-muted-foreground">USD</span>
                  </p>
                  <div className="flex items-center gap-1 text-sm">
                    <Zap className="size-4 text-yellow-400" />
                    <span className="font-semibold">
                      {pkg.credits.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">credits</span>
                  </div>
                  <p className="text-sm text-muted-foreground">≈ {pkg.credits} images</p>
                </CardContent>
                <CardFooter className="p-1">
                  <form
                    action="/api/credits/checkout"
                    method="POST"
                    className="w-full">
                    <input type="hidden" name="packageId" value={pkg.id} />
                    <Button type="submit" className="button w-full bg-secondary text-secondary-foreground">
                      <Zap className="size-4" />
                      Buy Now
                    </Button>
                  </form>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
