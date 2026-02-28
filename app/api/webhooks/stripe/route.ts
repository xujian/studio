import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // ─── One-time purchase or subscription checkout completed ─────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ received: true })
    }

    // Persist stripe_customer_id on the profile for future use
    if (session.customer && session.metadata?.userId) {
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: session.customer as string })
        .eq('id', session.metadata.userId)
        .is('stripe_customer_id', null)
    }

    // ── Subscription checkout ──
    if (session.mode === 'subscription') {
      const subscriptionId = session.subscription as string
      const userId = session.metadata?.userId
      const planId = session.metadata?.planId
      const credits = parseInt(session.metadata?.credits ?? '0', 10)

      if (!userId || !planId || !credits) {
        return NextResponse.json({ error: 'Missing subscription metadata' }, { status: 400 })
      }

      const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as Stripe.Subscription & { current_period_end: number }

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: session.customer as string,
        tier: planId,
        status: 'active',
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      }, { onConflict: 'user_id' })

      await supabase
        .from('profiles')
        .update({ subscription_tier: planId })
        .eq('id', userId)

      const { error } = await supabase.rpc('reset_subscription_credits', {
        user_uuid: userId,
        tier: planId,
      })

      if (error) {
        console.error('Failed to grant initial subscription credits:', error)
        return NextResponse.json({ error: 'Failed to grant credits' }, { status: 500 })
      }

      return NextResponse.json({ received: true })
    }

    // ── One-time credit pack ──
    const userId = session.metadata?.userId
    const credits = parseInt(session.metadata?.credits ?? '0', 10)

    if (!userId || !credits) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    // Idempotency: skip if already processed
    const { data: existing } = await supabase
      .from('transactions')
      .select('id')
      .eq('stripe_session_id', session.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ received: true })
    }

    const { error: creditsError } = await supabase.rpc('add_credits', {
      user_uuid: userId,
      amount: credits,
    })

    if (creditsError) {
      console.error('Failed to add credits:', creditsError)
      return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 })
    }

    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'credit_purchase',
      amount: credits,
      related_id: null,
      stripe_session_id: session.id,
      description: `Purchased ${credits} credits`,
    })
  }

  // ─── Monthly renewal ──────────────────────────────────────────────────────
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice

    // First invoice is handled by checkout.session.completed above
    if (invoice.billing_reason === 'subscription_create') {
      return NextResponse.json({ received: true })
    }

    const subscriptionId = (invoice as Stripe.Invoice & { subscription: string }).subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as Stripe.Subscription & { current_period_end: number }
    const userId = stripeSubscription.metadata?.userId
    const planId = stripeSubscription.metadata?.planId

    if (!userId || !planId) {
      console.error('Missing subscription metadata on renewal:', subscriptionId)
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId)

    const { error } = await supabase.rpc('reset_subscription_credits', {
      user_uuid: userId,
      tier: planId,
    })

    if (error) {
      console.error('Failed to reset subscription credits:', error)
      return NextResponse.json({ error: 'Failed to reset credits' }, { status: 500 })
    }
  }

  // ─── Payment failed ───────────────────────────────────────────────────────
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice & { subscription: string }
    const subscriptionId = invoice.subscription

    await supabase
      .from('subscriptions')
      .update({ status: 'past_due', updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', subscriptionId)
  }

  // ─── Subscription canceled ────────────────────────────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const userId = subscription.metadata?.userId

    await supabase
      .from('subscriptions')
      .update({ status: 'canceled', updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', subscription.id)

    if (userId) {
      await supabase
        .from('profiles')
        .update({ subscription_tier: 'free' })
        .eq('id', userId)
    }
  }

  // ─── Plan upgrade / downgrade ─────────────────────────────────────────────
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as unknown as Stripe.Subscription & { current_period_end: number }
    const userId = subscription.metadata?.userId
    const planId = subscription.metadata?.planId

    if (userId && planId) {
      await supabase
        .from('subscriptions')
        .update({
          tier: planId,
          status: subscription.status as 'active' | 'past_due' | 'canceled',
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id)

      await supabase
        .from('profiles')
        .update({ subscription_tier: planId })
        .eq('id', userId)
    }
  }

  return NextResponse.json({ received: true })
}
