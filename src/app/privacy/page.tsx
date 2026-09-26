import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — ReviewFlow',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 py-16 px-6 font-sans">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-700 mb-8 inline-block">← Back to home</Link>
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Privacy Policy</h1>
        <p className="text-zinc-400 text-sm mb-10">Last updated: September 2026</p>
        
        <div className="prose prose-zinc max-w-none space-y-8 text-zinc-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-3">1. What We Collect</h2>
            <p>ReviewFlow collects the minimum data necessary to operate the service:</p>
            <ul className="list-disc pl-5 space-y-1 mt-3 text-sm">
              <li><strong>Business owners:</strong> Name, email address, and business information you provide.</li>
              <li><strong>Customer feedback:</strong> Star rating (1–5), category, and optional text message. We do not require your name, email, or phone number.</li>
              <li><strong>Analytics:</strong> Anonymous event counts (scans, clicks). We do not track individual users.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-3">2. How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>To provide the ReviewFlow service to business owners.</li>
              <li>To display feedback analytics in the business dashboard.</li>
              <li>To send email notifications when a business enables them.</li>
              <li>To manage your subscription through Lemon Squeezy.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-3">3. Data Storage</h2>
            <p className="text-sm">Your data is stored securely on Supabase (PostgreSQL) with row-level security. We use Supabase infrastructure which complies with industry-standard security practices.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-3">4. Third Parties</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Lemon Squeezy:</strong> Payment processing. We never store card data.</li>
              <li><strong>Resend:</strong> Email delivery. Only used for transactional notifications.</li>
              <li><strong>Supabase:</strong> Database and authentication.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-3">5. Customer Feedback Data</h2>
            <p className="text-sm">Customer feedback submitted through QR codes is visible only to the business owner. We do not share or sell feedback data. Feedback pages are not indexed by search engines.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-3">6. Your Rights</h2>
            <p className="text-sm">You can request deletion of your account and all associated data by contacting us at <a href="mailto:privacy@reviewflow.app" className="text-zinc-900 underline">privacy@reviewflow.app</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-3">7. Contact</h2>
            <p className="text-sm">Questions? Email us at <a href="mailto:privacy@reviewflow.app" className="text-zinc-900 underline">privacy@reviewflow.app</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
