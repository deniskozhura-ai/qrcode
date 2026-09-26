import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import FeedbackClient from './FeedbackClient'
import type { Metadata } from 'next'

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
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-6 text-center">
        <div className="max-w-sm">
          <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-zinc-900 mb-2">Feedback page unavailable</h1>
          <p className="text-zinc-500 text-sm">This feedback page is temporarily unavailable. Please try again later.</p>
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
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-start py-10 px-4 font-sans">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />

          <div className="p-8 flex flex-col items-center text-center">
            {/* Logo */}
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name}
                className="w-20 h-20 rounded-2xl object-cover mb-5 shadow-sm"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 text-white text-2xl font-bold shadow-sm"
                style={{ backgroundColor: accent }}
              >
                {business.name.charAt(0).toUpperCase()}
              </div>
            )}

            <h1 className="text-2xl font-bold text-zinc-900 mb-1">{business.name}</h1>
            <p className="text-zinc-500 text-base mb-8">How was your experience?</p>

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

        <p className="text-center text-xs text-zinc-400 mt-6">
          Powered by <span className="font-semibold text-zinc-500">ReviewFlow</span>
        </p>
      </div>
    </div>
  )
}
