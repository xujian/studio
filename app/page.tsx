import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Hero } from '@/components/landing/hero'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Features } from '@/components/landing/features'
import { Pricing } from '@/components/landing/pricing'
import { CommunityShowcase } from '@/components/landing/community-showcase'
import { Footer } from '@/components/landing/footer'
import { StudioDemo } from '@/components/landing/studio-demo'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Portrait Generator — Create Studio Photos',
  description:
    'Create professional AI portrait photos from text in seconds. Choose scenes, lighting, outfits, and moods. Your personal AI photo studio.',
  alternates: {
    canonical: 'https://kanojostudio.com',
  },
}

export default async function Home() {
  // const supabase = await createClient()
  // const { data: { user } } = await supabase.auth.getUser()
  // if (user) redirect('/studio')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://kanojostudio.com/#website',
        url: 'https://kanojostudio.com',
        name: 'Kanojo Studio',
        description: 'AI-powered portrait photography platform',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://kanojostudio.com/community?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': 'https://kanojostudio.com/#organization',
        name: 'Kanojo Studio',
        url: 'https://kanojostudio.com',
        logo: {
          '@type': 'ImageObject',
          url: 'https://kanojostudio.com/logo.svg',
        },
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex flex-col gap-24">
        <Hero />
        <StudioDemo />
        <Features />
        <HowItWorks />
        <Pricing />
        <CommunityShowcase />
        <Footer />
      </div>
    </>
  )
}
