import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import FeedbackClient from './FeedbackClient'
import type { Metadata } from 'next'
import { AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function QrFeedbackPage({
  params,
}: {
  params: Promise<{ qrSlug: string }>
}) {
  const { qrSlug } = await params
  const db = getServiceClient()

  // Fetch QR and business in one join
  const { data: qrCode } = await db
    .from('qr_codes')
    .select('id, name, active, businesses(id, name, slug, logo_url, brand_color, google_review_url, status)')
    .eq('slug', qrSlug)
    .single()

  if (!qrCode) return notFound()

  const business = Array.isArray(qrCode.businesses) ? qrCode.businesses[0] : qrCode.businesses

  if (!qrCode.active || !business) return notFound()

  // Business inactive — subscription ended
  if (business.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-6 text-center antialiased">
        <div className="max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/40 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200/60 dark:border-amber-900/40 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Feedback page temporarily unavailable</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed">
            This customer feedback page is currently unavailable. Please check back later or speak with a team member.
          </p>
        </div>
      </div>
    )
  }

  // Track scan asynchronously (fire and forget, don't await)
  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/analytics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: 'qr_scan', business_id: business.id, qr_code_id: qrCode.id }),
  }).catch(() => {})

  const accent = business.brand_color || '#18181b'

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-zinc-100/60 to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex flex-col items-center justify-center py-8 px-4 font-sans antialiased">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Customer Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-lg shadow-zinc-900/5 border border-zinc-200/80 dark:border-zinc-800 overflow-hidden relative">
          {/* Top accent brand stripe */}
          <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />

          <div className="p-6 sm:p-8 flex flex-col items-center text-center">
            {/* Business Logo or Monogram */}
            {business.logo_url ? (
              <div className="w-20 h-20 rounded-2xl overflow-hidden mb-4 shadow-sm border border-zinc-100 dark:border-zinc-800 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={business.logo_url}
                  alt={business.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-4 text-white text-2xl font-extrabold shadow-sm"
                style={{ backgroundColor: accent }}
              >
                {business.name.charAt(0).toUpperCase()}
              </div>
            )}

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1">
              {business.name}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm mb-6">
              How was your experience today?
            </p>

            <div className="w-full">
              <FeedbackClient
                businessId={business.id}
                qrCodeId={qrCode.id}
                brandColor={accent}
                googleReviewUrl={business.google_review_url}
              />
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 mt-6 font-medium">
          Powered by <span className="font-semibold text-zinc-600 dark:text-zinc-400">ReviewFlow</span>
        </p>
      </div>
    </div>
  )
}
