import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AccountProfileForm } from '@/components/account-profile-form'
import { DeleteAccountButton } from '@/components/delete-account-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Subscription } from '@/lib/types'
import { SUBSCRIPTION_PLANS } from '@/lib/constants'
import { Zap, CreditCard, Globe2, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

const tierStyles: Record<string, string> = {
  free: 'bg-secondary text-secondary-foreground',
  basic: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  pro: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  max: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  const { data: subscription } = (await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .maybeSingle()) as { data: Subscription | null }

  const currentTier = profile?.subscription_tier ?? 'free'
  const planInfo = SUBSCRIPTION_PLANS.find(p => p.id === currentTier)
  const credits = profile?.credits ?? 0

  return (
    <div className="page-body flex w-full flex-col items-center px-4 md:px-8 pt-2 pb-16">
      <div className="w-full max-w-2xl space-y-10">
        <h1 className="text-2xl font-semibold">Account</h1>

        {/* Profile */}
        <section className="space-y-3">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Profile</h2>
          <AccountProfileForm
            name={profile?.name ?? session.user.user_metadata?.full_name ?? ''}
            avatar={profile?.avatar ?? session.user.user_metadata?.avatar_url ?? ''}
            createdAt={profile?.created_at ?? session.user.created_at}
          />
        </section>

        {/* Credits + Subscription side-by-side */}
        <section className="space-y-3">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Billing</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Credits card */}
            <Card className="relative overflow-hidden">
              <CardContent className="flex flex-col gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Credits</p>
                  <p className="text-3xl font-bold tabular-nums flex items-center gap-1.5">
                    <Zap className="credits size-6 shrink-0" />
                    {credits.toLocaleString()}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="w-fit">
                  <Link href="/credits">
                    Buy more
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Subscription card */}
            <Card>
              <CardContent className="flex flex-col gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Plan</p>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xl font-semibold capitalize">{planInfo?.label ?? currentTier}</p>
                    <Badge
                      variant="outline"
                      className={cn('text-[10px] px-1.5 py-0', tierStyles[currentTier])}
                    >
                      {currentTier}
                    </Badge>
                  </div>
                  {subscription ? (
                    <p className="text-xs text-muted-foreground">
                      Renews {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">{planInfo?.description ?? 'No active subscription'}</p>
                  )}
                </div>
                <form action="/api/credits/portal" method="POST">
                  <Button type="submit" variant="outline" size="sm">
                    <CreditCard className="size-3.5" />
                    Manage
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Connected Accounts */}
        <section className="space-y-3">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Connected Accounts</h2>
          <Card>
            <CardContent className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <Globe2 className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Google</p>
                <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
              </div>
              <Badge variant="outline" className="text-[10px] text-green-500 border-green-500/30 bg-green-500/5 shrink-0">
                Connected
              </Badge>
            </CardContent>
          </Card>
        </section>

        {/* Danger Zone */}
        <section className="space-y-3">
          <h2 className="text-xs font-medium text-destructive uppercase tracking-wider">Danger Zone</h2>
          <Card>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Delete account</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Permanently deletes your account and all data. This cannot be undone.
                </p>
              </div>
              <DeleteAccountButton />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
