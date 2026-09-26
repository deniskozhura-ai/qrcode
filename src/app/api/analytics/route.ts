import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AnalyticsEventSchema } from '@/lib/validations'
import { analyticsRateLimiter } from '@/lib/rateLimit'
import { getClientIp } from '@/lib/requestIp'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: Request) {
  // 1. Rate Limiting
  const ip = getClientIp(req)
  const rateLimitResult = analyticsRateLimiter.check(ip)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
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

  const parsed = AnalyticsEventSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || 'Invalid request payload' },
      { status: 400 }
    )
  }

  const { event_type, qr_code_id, business_id: clientBusinessId, metadata } = parsed.data

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

  // Verify cross-business relationship if client provided business_id
  if (clientBusinessId && clientBusinessId !== qrCode.business_id) {
    return NextResponse.json(
      { error: 'BOLA detected: Provided business_id does not match the QR code owner' },
      { status: 400 }
    )
  }

  // Verify business exists and is active
  const { data: business, error: bizError } = await db
    .from('businesses')
    .select('id, status')
    .eq('id', qrCode.business_id)
    .maybeSingle()

  if (bizError || !business || business.status !== 'active') {
    return NextResponse.json({ error: 'Business not found or inactive' }, { status: 400 })
  }

  // 4. Insert Verified Event using server-derived business_id
  const { error: insertError } = await db.from('analytics_events').insert({
    business_id: business.id,
    qr_code_id: qrCode.id,
    event_type,
    metadata: metadata ?? {},
  })

  if (insertError) {
    console.error('[analytics API] insert error:', insertError)
    return NextResponse.json({ error: 'Failed to record analytics event' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
