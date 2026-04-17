import type { Metadata } from 'next'
import Link from 'next/link'
import { Section, SubSection } from '../legal-components'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms and conditions governing your use of Kanojo Studio.',
  alternates: {
    canonical: 'https://kanojostudio.com/terms',
  },
}

const LAST_UPDATED = 'March 18, 2026'

export default function TermsPage() {
  return (
    <>
      <div className="pb-12 border-b border-border">
        <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4">
          Kanojo Studio
        </p>
        <h1>
          Terms of Service
        </h1>
        <p className="caption">Last updated: {LAST_UPDATED}</p>
      </div>

      <div className="py-10 border-b border-border">
        <p className="text-lg leading-relaxed text-muted-foreground italic">
          These Terms of Service govern your access to and use of Kanojo Studio. By creating an
          account or using the service, you agree to be bound by these terms. Please read them carefully.
        </p>
      </div>

      <div className="space-y-14 pt-12">

        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using Kanojo Studio (&ldquo;the Service&rdquo;), you agree to these Terms of Service
            and our <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground transition-colors">Privacy Policy</Link>.
            If you do not agree, do not use the Service.
          </p>
          <p>
            We may update these terms from time to time. We will notify you of material changes at
            least 14 days before they take effect. Continued use after changes constitutes acceptance.
          </p>
        </Section>

        <Section title="2. Eligibility">
          <p>
            You must be at least 18 years old to use Kanojo Studio. By using the Service, you
            represent that you meet this requirement. If you are using the Service on behalf of an
            organization, you represent that you have authority to bind that organization to these terms.
          </p>
        </Section>

        <Section title="3. Your Account">
          <p>
            You sign in using your Google account. You are responsible for all activity that occurs
            under your account. Keep your credentials secure and notify us immediately at{' '}
            <a href="mailto:support@kanojostudio.com" className="underline underline-offset-4 hover:text-foreground transition-colors">
              support@kanojostudio.com
            </a>{' '}
            if you suspect unauthorized access.
          </p>
          <p>
            We reserve the right to suspend or terminate accounts that violate these terms, engage in
            fraudulent activity, or pose a risk to the Service or other users.
          </p>
        </Section>

        <Section title="4. The Service">
          <p>
            Kanojo Studio is an AI-powered portrait photography platform. You can generate portrait
            photos from text prompts, upload reference assets, browse the community gallery, and
            purchase additional credits or asset packs.
          </p>
          <p>
            We may modify, suspend, or discontinue any part of the Service at any time. We will
            provide reasonable notice of significant changes where possible.
          </p>
        </Section>

        <Section title="5. Credits and Payments">
          <SubSection title="Credits">
            Generating photos consumes credits from your balance. Credit costs are displayed before
            each action. Credits have no cash value and are non-transferable between accounts.
          </SubSection>
          <SubSection title="Purchases">
            Credit purchases and subscriptions are processed by Stripe. All purchases are final.
            We do not offer refunds for consumed credits or expired subscription periods, except
            where required by law.
          </SubSection>
          <SubSection title="Subscriptions">
            Subscriptions renew automatically at the end of each billing period. You can cancel
            at any time from your account settings; cancellation takes effect at the end of the
            current period. We reserve the right to change subscription pricing with 30 days&rsquo; notice.
          </SubSection>
        </Section>

        <Section title="6. Content You Provide">
          <SubSection title="Your content">
            You retain ownership of any photos, prompts, or other content you upload or create
            (&ldquo;Your Content&rdquo;). By using the Service, you grant us a limited license to store,
            process, and display Your Content solely to operate the Service for you.
          </SubSection>
          <SubSection title="Community posts">
            When you share a generated photo to the community, you grant us and other users a
            non-exclusive, royalty-free license to view and display that photo within the Service.
            You can remove community posts at any time; removal from public feeds happens promptly,
            though cached copies may persist briefly.
          </SubSection>
          <SubSection title="Your responsibilities">
            You are solely responsible for Your Content. You represent that you have all rights
            necessary to upload and use it, and that it does not violate any law or third-party rights.
          </SubSection>
        </Section>

        <Section title="7. Acceptable Use">
          <p>You agree not to use the Service to:</p>
          <ul className="list-disc pl-5 space-y-2 mt-4">
            <li>Generate images of real, identifiable people without their consent</li>
            <li>Generate sexually explicit content involving minors (strictly prohibited and will be reported to authorities)</li>
            <li>Create deepfakes intended to deceive or defame</li>
            <li>Produce content that harasses, threatens, or incites violence against individuals or groups</li>
            <li>Violate any applicable law or regulation</li>
            <li>Attempt to reverse-engineer, scrape, or automate the Service beyond our public API</li>
            <li>Circumvent any credit, rate-limit, or access controls</li>
            <li>Upload malware or otherwise interfere with the Service&rsquo;s operation</li>
          </ul>
          <p className="mt-4">
            We may remove content and suspend accounts that violate these rules without prior notice.
          </p>
        </Section>

        <Section title="8. AI-Generated Content">
          <p>
            Photos generated by Kanojo Studio are produced by AI and may not always be accurate,
            appropriate, or suitable for every purpose. You are responsible for reviewing generated
            content before sharing or using it commercially.
          </p>
          <p>
            Ownership of AI-generated images is an evolving area of law. To the extent permitted
            by applicable law, we assign to you any rights we hold in photos you generate. We make
            no warranties about the commercial usability or copyright status of generated images.
          </p>
        </Section>

        <Section title="9. Intellectual Property">
          <p>
            The Kanojo Studio platform, including its software, design, trademarks, and brand assets,
            is owned by us and protected by intellectual property law. These terms do not grant you
            any rights to use our trademarks or branding without written permission.
          </p>
        </Section>

        <Section title="10. Third-Party Services">
          <p>
            The Service relies on third-party providers including Google (authentication and AI),
            Supabase (database and storage), and Stripe (payments). Your use of those services is
            governed by their respective terms and privacy policies. We are not responsible for
            the practices of third-party services.
          </p>
        </Section>

        <Section title="11. Disclaimers">
          <p>
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind,
            express or implied, including warranties of merchantability, fitness for a particular
            purpose, or non-infringement. We do not warrant that the Service will be uninterrupted,
            error-free, or that generated images will meet your expectations.
          </p>
        </Section>

        <Section title="12. Limitation of Liability">
          <p>
            To the maximum extent permitted by law, Kanojo Studio and its team shall not be liable
            for any indirect, incidental, special, consequential, or punitive damages arising from
            your use of the Service, including loss of profits, data, or goodwill.
          </p>
          <p>
            Our total liability for any claim arising from these terms or your use of the Service
            shall not exceed the greater of (a) the amount you paid us in the 12 months before the
            claim, or (b) $50 USD.
          </p>
        </Section>

        <Section title="13. Indemnification">
          <p>
            You agree to indemnify and hold harmless Kanojo Studio and its team from any claims,
            damages, or expenses (including legal fees) arising from Your Content, your use of the
            Service, or your violation of these terms.
          </p>
        </Section>

        <Section title="14. Governing Law">
          <p>
            These terms are governed by the laws of the jurisdiction in which Kanojo Studio is
            incorporated, without regard to conflict-of-law principles. Any disputes shall be
            resolved in the courts of that jurisdiction, and you consent to their exclusive jurisdiction.
          </p>
        </Section>

        <Section title="15. Contact">
          <p>
            Questions about these terms? Reach us at{' '}
            <a href="mailto:support@kanojostudio.com" className="underline underline-offset-4 hover:text-foreground transition-colors">
              support@kanojostudio.com
            </a>
            .
          </p>
        </Section>

      </div>
    </>
  )
}
