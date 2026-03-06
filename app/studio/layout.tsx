import type { Metadata } from 'next'
import Sidebar from '@/components/sidebar'

export const metadata: Metadata = {
  robots: { index: false, follow: false }
}

export default function StudioLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Sidebar />
      {children}
    </>
  )
}
