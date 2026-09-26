import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const VALID_EVENTS = [
  'qr_scan', 'rating_submitted', 'feedback_submitted', 
  'feedback_copied', 'google_review_clicked'
]

export async function POST(req: Request) {
  let body: { event_type?: string; business_id?: string; qr_code_id?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { event_type, business_id, qr_code_id } = body

  if (!event_type || !VALID_EVENTS.includes(event_type)) {
    return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 })
  }
  if (!business_id) {
    return NextResponse.json({ error: 'Missing business_id' }, { status: 400 })
  }

  const db = getServiceClient()
  await db.from('analytics_events').insert({
    business_id,
    qr_code_id: qr_code_id ?? null,
    event_type,
  })

  return NextResponse.json({ success: true })
}
