import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Rate limiting using a simple in-memory store (upgrade to Redis in production)
const rateLimit = new Map<string, { count: number; resetAt: number }>()

function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60_000 // 1 minute
  const maxRequests = 5

  const record = rateLimit.get(ip)
  if (!record || now > record.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (record.count >= maxRequests) return false
  record.count++
  return true
}

// Service client (bypasses RLS for anonymous inserts)
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: Request) {
  const ip = getClientIp(req)

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
  }

  let body: {
    business_id?: string
    qr_code_id?: string
    rating?: number
    category?: string | null
    message?: string | null
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { business_id, qr_code_id, rating, category, message } = body

  // Validate
  if (!business_id || typeof business_id !== 'string') {
    return NextResponse.json({ error: 'Missing business_id' }, { status: 400 })
  }
  if (typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })
  }
  if (message && typeof message === 'string' && message.length > 1000) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 })
  }

  const db = getServiceClient()

  // Verify business exists and is active
  const { data: business } = await db
    .from('businesses')
    .select('id, status')
    .eq('id', business_id)
    .single()

  if (!business || business.status !== 'active') {
    return NextResponse.json({ error: 'Business not found or inactive' }, { status: 404 })
  }

  // Insert feedback
  const { error } = await db.from('feedback').insert({
    business_id,
    qr_code_id: qr_code_id ?? null,
    rating,
    category: category ?? null,
    message: message ? message.trim().slice(0, 1000) : null,
    status: 'new',
  })

  if (error) {
    console.error('[feedback API] Insert error:', error)
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
