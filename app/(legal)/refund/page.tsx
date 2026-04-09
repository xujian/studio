import type { Metadata } from 'next'
import { Section } from '../legal-components'

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: 'Kanojo Studio refund policy for credit packs, subscriptions, and AI-generated images.',
  alternates: {
    canonical: 'https://kanojostudio.com/refund',
  },
}

const LAST_UPDATED = 'March 18, 2026'

export default function RefundPage() {
  return (
    <>
      <div className="pb-12 border-b border-border">
        <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4">
          Kanojo Studio
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold mb-6">
          Refund Policy
        </h1>
        <p className="text-muted-foreground">Last updated: {LAST_UPDATED}</p>
      </div>

      <div className="py-10 border-b border-border">
        <p className="text-lg leading-relaxed text-muted-foreground italic">
          At Kanojo Studio, we strive to provide a high-quality AI portrait generation experience.
          Due to the digital and instant nature of our services — AI-generated images are created
          and delivered immediately upon purchase — all sales are final and non-refundable except
          in the limited circumstances described below.
        </p>
      </div>

      <div className="space-y-14 pt-12">

        <Section title="1. No Refunds for Credit Packs or Subscriptions">
          <ul className="list-disc pl-5 space-y-2">
            <li>Credit packs, premium features, and subscription plans are non-refundable once purchased.</li>
            <li>Generated images cannot be returned or exchanged because they are custom, digital products created specifically for you.</li>
            <li>We do not offer refunds for dissatisfaction with output quality, as results depend on user inputs such as reference photos and style selections.</li>
          </ul>
        </Section>

        <Section title="2. Exceptions — When Refunds May Be Granted">
          <p>
            We may offer a full or partial refund at our sole discretion in the following cases:
          </p>
          <ul className="list-disc pl-5 space-y-3 mt-4">
            <li>
              <strong className="text-foreground">Technical failure</strong> — The service fails to generate or deliver any image after payment, and the issue cannot be resolved within 48 hours.
            </li>
            <li>
              <strong className="text-foreground">Unauthorized charge</strong> — You can demonstrate the purchase was not authorized (e.g., fraud or a stolen card). Contact us immediately.
            </li>
            <li>
              <strong className="text-foreground">Duplicate charge</strong> — You were charged twice for the same order.
            </li>
            <li>
              <strong className="text-foreground">Within 24 hours of purchase</strong> — If no credits have been used and no images generated, we may offer a one-time courtesy refund on a case-by-case basis.
            </li>
          </ul>
        </Section>

        <Section title="3. How to Request a Refund">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Email us at{' '}
              <a
                href="mailto:support@kanojostudio.com"
                className="underline underline-offset-4 hover:text-foreground transition-colors"
              >
                support@kanojostudio.com
              </a>
              {' '}within <strong className="text-foreground">7 days</strong> of purchase.
            </li>
            <li>
              Include your order or transaction ID, the email address used for purchase, the reason for your request, and any supporting evidence such as screenshots.
            </li>
            <li>
              We will review your request within <strong className="text-foreground">3–5 business days</strong> and respond via email.
            </li>
          </ul>
        </Section>

        <Section title="4. Processing Refunds">
          <ul className="list-disc pl-5 space-y-2">
            <li>Approved refunds will be processed to the original payment method within <strong className="text-foreground">7–14 business days</strong>.</li>
            <li>We are not responsible for delays caused by your payment provider, such as your bank or credit card issuer.</li>
          </ul>
        </Section>

        <Section title="5. Changes to This Policy">
          <p>
            We may update this Refund Policy from time to time. The updated version will be posted
            on this page with a revised &ldquo;Last updated&rdquo; date. By using Kanojo Studio, you agree
            to this Refund Policy.
          </p>
        </Section>

      </div>
    </>
  )
}
