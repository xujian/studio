import { Footer } from '@/components/landing/footer'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-body">
      <div className="mx-auto max-w-3xl px-6 pt-20 pb-24">
        {children}
      </div>
      <Footer />
    </div>
  )
}
