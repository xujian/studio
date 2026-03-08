import { Footer } from '@/components/landing/footer'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Footer />
    </>
  )
}
