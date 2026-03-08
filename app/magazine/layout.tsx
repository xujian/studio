import { Footer } from '@/components/landing/footer'

export default function MagazineLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <Footer />
    </>
  )
}
