import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Providers } from '@/context/providers'
import { Header } from '@/components/header'
import { cn } from '@/lib/utils'
import '@/styles/app.css'
import Sidebar from '@/components/sidebar'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

export const metadata: Metadata = {
  metadataBase: new URL('https://kanojostudio.com'),
  title: {
    default: 'Kanojo Studio — AI Portrait Generator',
    template: '%s | Kanojo Studio',
  },
  description:
    'Kanojo Studio is an AI portrait generator that creates stunning, realistic portrait photos from text prompts. Generate professional-quality AI portraits in seconds.',
  keywords: [
    'ai portrait generator',
    'ai photo studio',
    'ai portrait photography',
    'ai headshot generator',
    'generate ai portraits online',
    'ai portrait studio',
  ],
  authors: [{ name: 'Kanojo Studio' }],
  creator: 'Kanojo Studio',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://kanojostudio.com',
    siteName: 'Kanojo Studio',
    title: 'Kanojo Studio — AI Portrait Generator',
    description:
      'Generate stunning AI portrait photos from text prompts. Professional-quality results in seconds.',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Kanojo Studio — AI Portrait Generator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kanojo Studio — AI Portrait Generator',
    description:
      'Generate stunning AI portrait photos from text prompts. Professional-quality results in seconds.',
    images: ['/og.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
      </head>
      <body className={cn(inter.variable, playfair.variable, inter.className, "min-h-screen antialiased")}>
        <Providers>
          <Header />
          <main className="container min-h-[calc(100vh-6rem)] mx-auto pt-24">
            {children}
          </main>
          {modal}
        </Providers>
      </body>
    </html>
  )
}
