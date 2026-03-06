import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}
import { CheckCircle2, Zap } from 'lucide-react'

export default function CreditsPurchaseSuccessPage() {
  return (
    <section className="flex w-full flex-col items-center justify-center px-8 py-24">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle2 className="size-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-semibold">Payment successful</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your credits have been added to your account. Ready to create?
        </p>
        <Link
          href="/studio"
          className="mt-8 flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Zap className="size-4" />
          Go to Studio
        </Link>
      </div>
    </section>
  )
}
