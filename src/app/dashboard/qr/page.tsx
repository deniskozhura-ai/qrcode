import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import QrManagement from './QrManagement'

export default async function QrPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, slug')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const business = businesses?.[0]

  if (!business) redirect('/dashboard/settings/business')

  const { data: qrCodes } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  // Get scan/feedback counts per QR
  const qrIds = (qrCodes ?? []).map(q => q.id)
  const [scansRes, feedbackRes] = await Promise.all([
    qrIds.length > 0
      ? supabase.from('analytics_events').select('qr_code_id').in('qr_code_id', qrIds).eq('event_type', 'qr_scan')
      : { data: [] },
    qrIds.length > 0
      ? supabase.from('feedback').select('qr_code_id, rating').in('qr_code_id', qrIds)
      : { data: [] },
  ])

  const scansByQr: Record<string, number> = {}
  const feedbackByQr: Record<string, number[]> = {}
  ;(scansRes.data ?? []).forEach(e => {
    if (e.qr_code_id) scansByQr[e.qr_code_id] = (scansByQr[e.qr_code_id] ?? 0) + 1
  })
  ;(feedbackRes.data ?? []).forEach(f => {
    if (f.qr_code_id) {
      if (!feedbackByQr[f.qr_code_id]) feedbackByQr[f.qr_code_id] = []
      feedbackByQr[f.qr_code_id].push(f.rating)
    }
  })

  const qrWithStats = (qrCodes ?? []).map(q => ({
    ...q,
    scans: scansByQr[q.id] ?? 0,
    feedbackCount: feedbackByQr[q.id]?.length ?? 0,
    avgRating: feedbackByQr[q.id]?.length
      ? (feedbackByQr[q.id].reduce((a, b) => a + b, 0) / feedbackByQr[q.id].length).toFixed(1)
      : null,
  }))

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3005'

  return (
    <QrManagement
      businessId={business.id}
      qrCodes={qrWithStats}
      appUrl={appUrl}
    />
  )
}
