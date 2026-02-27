import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId
    const credits = parseInt(session.metadata?.credits ?? '0', 10)

    if (!userId || !credits) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error: profileError } = await supabase.rpc('add_credits', {
      user_uuid: userId,
      amount: credits,
    })

    if (profileError) {
      console.error('Failed to add credits:', profileError)
      return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 })
    }

    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'credit_purchase',
      amount: credits,
      related_id: null,
      description: `Purchased ${credits} credits`,
    })
  }

  return NextResponse.json({ received: true })
}
