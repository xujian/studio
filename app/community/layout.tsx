import { Footer } from '@/components/landing/footer'

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Footer />
    </>
  )
}
