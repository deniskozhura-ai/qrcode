import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — ReviewFlow',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 py-16 px-6 font-sans">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-700 mb-8 inline-block">← Back to home</Link>
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Terms of Service</h1>
        <p className="text-zinc-400 text-sm mb-10">Last updated: September 2026</p>
        
        <div className="space-y-8 text-zinc-600 leading-relaxed text-sm">
          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-3">1. Service</h2>
            <p>ReviewFlow provides a customer feedback collection platform for local businesses. By using ReviewFlow, you agree to these terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-3">2. Billing</h2>
            <p>ReviewFlow charges 299 грн/month after a 7-day free trial. Billing is managed by Lemon Squeezy. You may cancel at any time; access continues until the end of the paid period.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-3">3. Google Review Policy</h2>
            <p>ReviewFlow does not restrict customer access to Google Reviews based on rating. All customers have equal access to the Google Review link regardless of their feedback rating. Any use of ReviewFlow to gate, filter, or manipulate Google Reviews is strictly prohibited.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-3">4. Acceptable Use</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You may not use ReviewFlow to generate fake reviews.</li>
              <li>You may not use ReviewFlow for spam or harassment.</li>
              <li>You may not abuse the platform to circumvent Google&apos;s review policies.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-3">5. Limitations</h2>
            <p>ReviewFlow is provided &ldquo;as is&rdquo;. We are not responsible for the content of customer feedback submitted through the platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-3">6. Contact</h2>
            <p>Contact us at <a href="mailto:support@reviewflow.app" className="text-zinc-900 underline">support@reviewflow.app</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
