import { Footer } from '@/components/landing/footer'

export default function MomentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Footer />
    </>
  )
}
