import type { Metadata } from 'next'
import { Section, SubSection } from '../legal-components'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Kanojo Studio collects, uses, and protects your personal information.',
  alternates: {
    canonical: 'https://kanojostudio.com/privacy',
  },
}

const LAST_UPDATED = 'March 18, 2026'

export default function PrivacyPage() {
  return (
    <>
      <div className="pb-12 border-b border-border">
        <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4">
          Kanojo Studio
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold mb-6">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground">Last updated: {LAST_UPDATED}</p>
      </div>

      <div className="py-10 border-b border-border">
        <p className="text-lg leading-relaxed text-muted-foreground italic">
          Kanojo Studio (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is committed to protecting your
          privacy. This policy explains what information we collect, how we use it, and the
          choices you have.
        </p>
      </div>

      <div className="space-y-14 pt-12">

        <Section title="1. Information We Collect">
          <p>We collect information you provide directly and information generated through your use of the service.</p>
          <SubSection title="Account information">
            When you sign in with Google, we receive your name, email address, and profile photo from Google. We store this to identify your account and personalize your experience.
          </SubSection>
          <SubSection title="Content you create">
            We store the prompts you write, the photos you generate, the assets you upload (such as face photos), and any posts you share to the community.
          </SubSection>
          <SubSection title="Usage data">
            We collect standard log data including your IP address, browser type, pages visited, and actions taken within the app. This helps us diagnose issues and improve the product.
          </SubSection>
          <SubSection title="Payment information">
            Credit purchases are processed by Stripe. We store your Stripe customer ID and subscription status, but we never see or store your full card number.
          </SubSection>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>To provide and operate the Kanojo Studio service</li>
            <li>To generate AI portrait photos from your prompts and uploaded assets</li>
            <li>To manage your account, credits, and subscriptions</li>
            <li>To display your shared posts in the community feed</li>
            <li>To send transactional emails (account activity, receipts)</li>
            <li>To detect and prevent abuse, fraud, and violations of our terms</li>
            <li>To improve our AI models and generation quality (see Section 4)</li>
          </ul>
        </Section>

        <Section title="3. Your Uploaded Photos">
          <p>
            Face photos and other images you upload are used solely to personalize your generated portraits.
            They are stored securely in your private account folder and are not shared with other users or
            used to train AI models without your explicit consent.
          </p>
          <p className="mt-4">
            You can delete your uploaded assets at any time from your account. Deletion removes the file
            from our storage within 30 days.
          </p>
        </Section>

        <Section title="4. AI Generation and Your Content">
          <p>
            Photos you generate are stored privately by default. If you choose to share a photo to the
            community, it becomes publicly visible under your profile.
          </p>
          <p className="mt-4">
            We may use anonymized, aggregated generation data (prompts and outputs) to improve our
            AI systems. We will not use your personal face photos for model training without a separate,
            explicit opt-in.
          </p>
        </Section>

        <Section title="5. Sharing Your Information">
          <p>We do not sell your personal information. We share data only in these limited circumstances:</p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground mt-4">
            <li><strong className="text-foreground">Service providers</strong> — Supabase (database and storage), Stripe (payments), Google (authentication and AI generation via Gemini API). Each is bound by their own privacy policies and our data processing agreements.</li>
            <li><strong className="text-foreground">Legal requirements</strong> — When required by law, court order, or to protect the rights and safety of our users.</li>
            <li><strong className="text-foreground">Business transfers</strong> — In connection with a merger, acquisition, or sale of assets, with notice provided to users.</li>
          </ul>
        </Section>

        <Section title="6. Cookies and Tracking">
          <p>
            We use essential cookies to maintain your login session. We do not use third-party advertising
            cookies or tracking pixels. Analytics, if used, are privacy-preserving and do not fingerprint
            individual users.
          </p>
        </Section>

        <Section title="7. Data Retention">
          <p>
            We retain your account data for as long as your account is active. Generated photos are kept
            indefinitely unless you delete them. If you delete your account, we remove your personal
            information within 30 days, except where retention is required by law (e.g., billing records).
          </p>
        </Section>

        <Section title="8. Your Rights">
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground mt-4">
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your data in a portable format</li>
            <li>Object to or restrict certain processing</li>
          </ul>
          <p className="mt-4">
            To exercise any of these rights, email us at{' '}
            <a href="mailto:privacy@kanojostudio.com" className="underline underline-offset-4 hover:text-foreground transition-colors">
              privacy@kanojostudio.com
            </a>
            . We will respond within 30 days.
          </p>
        </Section>

        <Section title="9. Children's Privacy">
          <p>
            Kanojo Studio is not directed at children under 13. We do not knowingly collect personal
            information from children. If you believe a child has provided us with personal data, please
            contact us and we will delete it promptly.
          </p>
        </Section>

        <Section title="10. Security">
          <p>
            We use industry-standard security measures including HTTPS encryption, row-level security
            policies on our database, and access controls on stored files. No system is perfectly secure,
            but we take reasonable steps to protect your information.
          </p>
        </Section>

        <Section title="11. Changes to This Policy">
          <p>
            We may update this policy as the product evolves. We will notify you of material changes
            via email or a prominent notice in the app at least 14 days before they take effect.
            Continued use after changes constitutes acceptance.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            Questions or concerns? Reach us at{' '}
            <a href="mailto:privacy@kanojostudio.com" className="underline underline-offset-4 hover:text-foreground transition-colors">
              privacy@kanojostudio.com
            </a>
            .
          </p>
        </Section>

      </div>
    </>
  )
}
