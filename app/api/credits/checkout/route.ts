import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { CREDIT_PACKAGES } from '@/lib/constants'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const packageId = formData.get('packageId')

  const pkg = CREDIT_PACKAGES.find(p => p.id === packageId)
  if (!pkg) {
    return NextResponse.json({ error: 'Invalid package' }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: pkg.price,
          product_data: {
            name: `${pkg.credits} Credits — ${pkg.label}`,
            description: `${pkg.credits} credits for Kanojo Studio`,
          },
        },
      },
    ],
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
