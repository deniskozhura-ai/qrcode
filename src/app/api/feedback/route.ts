import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { FeedbackInputSchema } from '@/lib/validations'
import { feedbackRateLimiter } from '@/lib/rateLimit'
import { getClientIp } from '@/lib/requestIp'
import { logger } from '@/lib/logger'
import { sendNegativeFeedbackAlert } from '@/lib/email'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: Request) {
  // 1. Rate Limiting (5 requests / min per IP)
  const ip = getClientIp(req)
  const rateLimitResult = await feedbackRateLimiter.check(ip)
  if (!rateLimitResult.success) {
    logger.rateLimitHit('feedback', { ip })
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)),
        },
      }
    )
  }

  // 2. Parse & Validate Payload
  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const parsed = FeedbackInputSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || 'Invalid feedback data' },
      { status: 400 }
    )
  }

  const { qr_code_id, rating, category, message, business_id: clientBusinessId } = parsed.data

  const db = getServiceClient()

  // 3. Resolve & Verify QR Code and Business (Defense against BOLA / Forged IDs)
  const { data: qrCode, error: qrError } = await db
    .from('qr_codes')
    .select('id, business_id, active')
    .eq('id', qr_code_id)
    .maybeSingle()

  if (qrError || !qrCode || !qrCode.active) {
    return NextResponse.json({ error: 'QR code not found or inactive' }, { status: 400 })
  }

  // Cross-business ownership check: client must not forge business_id
  if (clientBusinessId && clientBusinessId !== qrCode.business_id) {
    logger.bolaAttempt('feedback', { ip, providedBusinessId: clientBusinessId, actualBusinessId: qrCode.business_id })
    return NextResponse.json(
      { error: 'BOLA detected: Provided business_id does not match the QR code owner' },
      { status: 400 }
    )
  }

  // Verify business is active — also fetch owner info for notifications
  const { data: business, error: bizError } = await db
    .from('businesses')
    .select('id, name, status, owner_id')
    .eq('id', qrCode.business_id)
    .maybeSingle()

  if (bizError || !business || business.status !== 'active') {
    return NextResponse.json({ error: 'Business not found or inactive' }, { status: 404 })
  }

  // 4. Insert Verified Feedback using server-derived business_id and qr_code_id
  const { data: inserted, error: insertError } = await db
    .from('feedback')
    .insert({
      business_id: business.id,
      qr_code_id: qrCode.id,
      rating,
      category: category ? category.trim() : null,
      message: message ? message.trim() : null,
      status: 'new',
    })
    .select('id')
    .single()

  if (insertError) {
    logger.error('feedback.insert_failed', { error: insertError.message })
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
  }

  logger.info('feedback.submitted', { rating, businessId: business.id, feedbackId: inserted?.id })

  // 5. Fire-and-forget: send email notification for negative feedback (rating ≤ 3)
  if (rating <= 3 && inserted?.id) {
    // Check if owner has opted in to negative feedback notifications
    const { data: profile } = await db
      .from('profiles')
      .select('email, name, notify_negative_feedback')
      .eq('id', business.owner_id)
      .maybeSingle()

    if (profile?.notify_negative_feedback && profile.email) {
      // Non-blocking — don't await, don't let email failure affect response
      sendNegativeFeedbackAlert({
        ownerEmail: profile.email,
        ownerName: profile.name,
        businessName: business.name,
        rating,
        category: category ?? null,
        message: message ?? null,
        feedbackId: inserted.id,
      }).catch((err) => logger.error('email.notification_failed', { error: String(err) }))
    }
  }

  return NextResponse.json({ success: true, id: inserted?.id })
}
