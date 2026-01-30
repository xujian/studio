import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/context/providers'
import { Header } from '@/components/header'
import { cn } from '@/lib/utils'
import '@/styles/app.css'
import Sidebar from '@/components/sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Kanojo Studio - AI Portrait Photography',
  description: 'Generate professional AI-powered portrait photos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
      </head>
      <body className={cn(inter.className, "min-h-screen antialiased")}>
        <Providers>
          <Header />
          <main className="container min-h-[calc(100vh-6rem)] mx-auto pt-24">
            {children}
          </main>
          <Sidebar />
        </Providers>
      </body>
    </html>
  )
}
