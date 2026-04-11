import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CREDIT_PACKAGES, SUBSCRIPTION_PLANS } from '@/lib/constants'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const packageId = formData.get('packageId') as string | null
  const planId = formData.get('planId') as string | null
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!

  // --- One-time credit pack ---
  if (packageId) {
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId)
    if (!pkg) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 })
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: pkg.price,
          product_data: {
            name: `${pkg.credits} Credits — ${pkg.label}`,
            description: `${pkg.credits} credits for Kanojo Studio`,
          },
        },
      }],
      metadata: {
        userId: session.user.id,
        credits: String(pkg.credits),
        packageId: pkg.id,
      },
      success_url: `${baseUrl}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/credits`,
    })

    return NextResponse.redirect(checkoutSession.url!, 303)
  }

  // --- Subscription ---
  if (planId) {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId)
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('customer, tier')
      .eq('id', session.user.id)
      .single()

    // Already subscribed (any tier) — send to portal to change plan instead
    if (profile?.tier && profile.tier !== 'free') {
      return NextResponse.redirect(`${baseUrl}/credits`, 303)
    }

    const customerParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      metadata: {
        userId: session.user.id,
        planId: plan.id,
        credits: String(plan.credits),
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          planId: plan.id,
          credits: String(plan.credits),
        },
      },
      success_url: `${baseUrl}/credits/success?session_id={CHECKOUT_SESSION_ID}&type=subscription`,
      cancel_url: `${baseUrl}/credits`,
    }

    if (profile?.customer) {
      customerParams.customer = profile.customer
    } else {
      customerParams.customer_email = session.user.email ?? undefined
    }

    const checkoutSession = await stripe.checkout.sessions.create(customerParams)
    return NextResponse.redirect(checkoutSession.url!, 303)
  }

  return NextResponse.json({ error: 'Missing packageId or planId' }, { status: 400 })
}
