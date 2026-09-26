'use server'

import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { FeedbackInputSchema, AnalyticsEventSchema } from '@/lib/validations'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function submitFeedback(formData: FormData) {
  const rawQrId = formData.get('qr_code_id') as string
  const rawRating = Number(formData.get('rating'))
  const rawCategory = (formData.get('category') as string) || null
  const rawMessage = (formData.get('message') as string) || null
  const rawBusinessId = (formData.get('business_id') as string) || undefined

  const parsed = FeedbackInputSchema.safeParse({
    qr_code_id: rawQrId,
    rating: rawRating,
    category: rawCategory,
    message: rawMessage,
    business_id: rawBusinessId,
  })

  if (!parsed.success) {
    throw new Error(`Invalid input: ${parsed.error.errors[0]?.message}`)
  }

  const { qr_code_id, rating, category, message, business_id: clientBusinessId } = parsed.data
  const db = getServiceClient()

  // Verify QR code & active business
  const { data: qrCode, error: qrErr } = await db
    .from('qr_codes')
    .select('id, business_id, active')
    .eq('id', qr_code_id)
    .maybeSingle()

  if (qrErr || !qrCode || !qrCode.active) {
    throw new Error('Invalid or inactive QR code')
  }

  if (clientBusinessId && clientBusinessId !== qrCode.business_id) {
    throw new Error('BOLA violation: business_id does not match QR owner')
  }

  const { data: business, error: bizErr } = await db
    .from('businesses')
    .select('id, status')
    .eq('id', qrCode.business_id)
    .maybeSingle()

  if (bizErr || !business || business.status !== 'active') {
    throw new Error('Business not found or inactive')
  }

  const { error: insertErr } = await db.from('feedback').insert([{
    business_id: business.id,
    qr_code_id: qrCode.id,
    rating,
    category,
    message,
    status: 'new',
  }])

  if (insertErr) {
    console.error('[submitFeedback] Insert error:', insertErr)
    throw new Error('Failed to submit feedback')
  }

  // Record analytics event
  await db.from('analytics_events').insert([{
    business_id: business.id,
    qr_code_id: qrCode.id,
    event_type: 'feedback_submitted',
    metadata: { rating, category },
  }])

  redirect(`/q/success?business_id=${business.id}&rating=${rating}`)
}

export async function trackGoogleClick(qr_code_id: string, business_id?: string) {
  const parsed = AnalyticsEventSchema.safeParse({
    event_type: 'google_review_clicked',
    qr_code_id,
    business_id,
  })
  if (!parsed.success) return

  const db = getServiceClient()
  const { data: qrCode } = await db
    .from('qr_codes')
    .select('id, business_id, active')
    .eq('id', qr_code_id)
    .maybeSingle()

  if (!qrCode || !qrCode.active) return
  if (business_id && business_id !== qrCode.business_id) return

  await db.from('analytics_events').insert([{
    business_id: qrCode.business_id,
    qr_code_id: qrCode.id,
    event_type: 'google_review_clicked',
  }])
}

export async function trackScan(qr_code_id: string, business_id?: string) {
  const parsed = AnalyticsEventSchema.safeParse({
    event_type: 'qr_scan',
    qr_code_id,
    business_id,
  })
  if (!parsed.success) return

  const db = getServiceClient()
  const { data: qrCode } = await db
    .from('qr_codes')
    .select('id, business_id, active')
    .eq('id', qr_code_id)
    .maybeSingle()

  if (!qrCode || !qrCode.active) return
  if (business_id && business_id !== qrCode.business_id) return

  await db.from('analytics_events').insert([{
    business_id: qrCode.business_id,
    qr_code_id: qrCode.id,
    event_type: 'qr_scan',
  }])
}
