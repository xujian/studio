import { Footer } from '@/components/landing/footer'

export default function CreditsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Footer />
    </>
  )
}
