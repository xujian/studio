import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
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

    // Persist customer on the profile for future use
    if (session.customer && session.metadata?.userId) {
      await supabase
        .from('profiles')
        .update({ customer: session.customer as string })
        .eq('id', session.metadata.userId)
        .is('customer', null)
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

      const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
      const periodEnd = stripeSubscription.items.data[0].current_period_end

      await supabase.from('subscriptions').upsert({
        user: userId,
        subscription: subscriptionId,
        customer: session.customer as string,
        tier: planId,
        status: 'active',
        end: new Date(periodEnd * 1000).toISOString(),
      }, { onConflict: 'user' })

      await supabase
        .from('profiles')
        .update({ tier: planId })
        .eq('id', userId)

      // Idempotency: skip if this checkout session was already processed
      const { data: existingSub } = await supabase
        .from('transactions')
        .select('id')
        .eq('stripe_session_id', session.id)
        .maybeSingle()

      if (existingSub) {
        return NextResponse.json({ received: true })
      }

      const { error } = await supabase.rpc('reset_subscription_credits', {
        user_uuid: userId,
        tier: planId,
      })

      if (error) {
        console.error('Failed to grant initial subscription credits:', error)
        return NextResponse.json({ error: 'Failed to grant credits' }, { status: 500 })
      }

      // Record with stripe_session_id for idempotency
      await supabase.from('transactions').insert({
        user: userId,
        type: 'subscription_reset',
        amount: credits,
        stripe_session_id: session.id,
        description: `Subscription started: ${planId} plan (${credits} credits)`,
      })

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
      user: userId,
      type: 'credit_purchase',
      amount: credits,
      ref: null,
      stripe_session_id: session.id,
      description: `Purchased ${credits} credits`,
    })
  }

  // ─── Monthly renewal ──────────────────────────────────────────────────────
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice & { subscription: string }

    // First invoice is handled by checkout.session.completed above
    if (invoice.billing_reason === 'subscription_create') {
      return NextResponse.json({ received: true })
    }

    // Idempotency: skip if this invoice was already processed
    const { data: existingRenewal } = await supabase
      .from('transactions')
      .select('id')
      .eq('stripe_session_id', invoice.id)
      .maybeSingle()

    if (existingRenewal) {
      return NextResponse.json({ received: true })
    }

    const subscriptionId = invoice.subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
    const userId = stripeSubscription.metadata?.userId
    const planId = stripeSubscription.metadata?.planId
    const credits = parseInt(stripeSubscription.metadata?.credits ?? '0', 10)
    const periodEnd = stripeSubscription.items.data[0].current_period_end

    if (!userId || !planId) {
      console.error('Missing subscription metadata on renewal:', subscriptionId)
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        end: new Date(periodEnd * 1000).toISOString(),
        updated: new Date().toISOString(),
      })
      .eq('subscription', subscriptionId)

    const { error } = await supabase.rpc('reset_subscription_credits', {
      user_uuid: userId,
      tier: planId,
    })

    if (error) {
      console.error('Failed to reset subscription credits:', error)
      return NextResponse.json({ error: 'Failed to reset credits' }, { status: 500 })
    }

    // Record with invoice.id in stripe_session_id for idempotency
    await supabase.from('transactions').insert({
      user: userId,
      type: 'subscription_reset',
      amount: credits,
      stripe_session_id: invoice.id,
      description: `Subscription renewed: ${planId} plan (${credits} credits)`,
    })
  }

  // ─── Payment failed ───────────────────────────────────────────────────────
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice & { subscription: string }
    const subscriptionId = invoice.subscription

    await supabase
      .from('subscriptions')
      .update({ status: 'past_due', updated: new Date().toISOString() })
      .eq('subscription', subscriptionId)
  }

  // ─── Subscription canceled ────────────────────────────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const userId = subscription.metadata?.userId

    if (!userId) {
      console.error('Missing userId metadata on subscription.deleted:', subscription.id)
    }

    await supabase
      .from('subscriptions')
      .update({ status: 'canceled', updated: new Date().toISOString() })
      .eq('subscription', subscription.id)

    if (userId) {
      await supabase
        .from('profiles')
        .update({ tier: 'free' })
        .eq('id', userId)
    }
  }

  // ─── Plan upgrade / downgrade ─────────────────────────────────────────────
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription
    const userId = subscription.metadata?.userId
    const planId = subscription.metadata?.planId
    const periodEnd = subscription.items.data[0].current_period_end

    if (!userId || !planId) {
      console.error('Missing userId/planId metadata on subscription.updated:', subscription.id)
    }

    if (userId && planId) {
      await supabase
        .from('subscriptions')
        .update({
          tier: planId,
          status: subscription.status as 'active' | 'past_due' | 'canceled',
          end: new Date(periodEnd * 1000).toISOString(),
          updated: new Date().toISOString(),
        })
        .eq('subscription', subscription.id)

      await supabase
        .from('profiles')
        .update({ tier: planId })
        .eq('id', userId)
    }
  }

  return NextResponse.json({ received: true })
}
