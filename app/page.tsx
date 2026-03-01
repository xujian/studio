import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Hero } from '@/components/landing/hero'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Features } from '@/components/landing/features'
import { Pricing } from '@/components/landing/pricing'
import { CommunityShowcase } from '@/components/landing/community-showcase'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/studio')

  return (
    <div className="flex flex-col gap-24 pb-24">
      <Hero />
      <HowItWorks />
      <Features />
      <Pricing />
      <CommunityShowcase />
    </div>
  )
}
