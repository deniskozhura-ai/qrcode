import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { verifyWebhookSignature } from '@/lib/billing/lemonsqueezy'
import { mapLsStatus } from '@/lib/billing/access'
import type { LsWebhookPayload } from '@/lib/billing/lemonsqueezy'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: Request) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-signature') ?? ''
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET

  if (!secret) {
    console.error('[webhook] LEMONSQUEEZY_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  // Verify signature
  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    console.warn('[webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: LsWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventName = payload.meta.event_name
  const eventId = payload.data.id
  const attrs = payload.data.attributes
  const userId = payload.meta.custom_data?.user_id

  const db = getServiceClient()

  // Idempotency check
  const { data: existing } = await db
    .from('webhook_events')
    .select('id')
    .eq('provider', 'lemonsqueezy')
    .eq('event_id', eventId)
    .maybeSingle()

  if (existing) {
    console.log(`[webhook] Duplicate event ${eventId}, skipping`)
    return NextResponse.json({ received: true })
  }

  // Record event for idempotency
  await db.from('webhook_events').insert({
    provider: 'lemonsqueezy',
    event_id: eventId,
    event_type: eventName,
  })

  const subscriptionData = {
    provider: 'lemonsqueezy',
    provider_subscription_id: payload.data.id,
    provider_product_id: String(attrs.product_id),
    provider_variant_id: String(attrs.variant_id),
    provider_customer_id: String(attrs.customer_id),
    status: mapLsStatus(attrs.status),
    trial_ends_at: attrs.trial_ends_at,
    current_period_start: attrs.created_at,
    current_period_end: attrs.renews_at ?? attrs.ends_at,
    cancelled_at: attrs.cancelled ? new Date().toISOString() : null,
    cancel_at_period_end: attrs.cancelled,
    updated_at: new Date().toISOString(),
  }

  switch (eventName) {
    case 'subscription_created': {
      if (!userId) {
        console.error('[webhook] subscription_created: no user_id in custom_data')
        break
      }
      await db.from('subscriptions').upsert({
        user_id: userId,
        ...subscriptionData,
      }, { onConflict: 'user_id' })
      console.log(`[webhook] Subscription created for user ${userId}`)
      break
    }

    case 'subscription_updated':
    case 'subscription_resumed':
    case 'subscription_unpaused':
    case 'subscription_payment_success':
    case 'subscription_payment_recovered':
    case 'subscription_trial_will_end': {
      await db.from('subscriptions')
        .update(subscriptionData)
        .eq('provider_subscription_id', payload.data.id)
      break
    }

    case 'subscription_cancelled': {
      await db.from('subscriptions')
        .update({
          ...subscriptionData,
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancel_at_period_end: true,
        })
        .eq('provider_subscription_id', payload.data.id)
      break
    }

    case 'subscription_expired': {
      await db.from('subscriptions')
        .update({ ...subscriptionData, status: 'expired' })
        .eq('provider_subscription_id', payload.data.id)
      break
    }

    case 'subscription_paused': {
      await db.from('subscriptions')
        .update({ ...subscriptionData, status: 'paused' })
        .eq('provider_subscription_id', payload.data.id)
      break
    }

    case 'subscription_payment_failed': {
      await db.from('subscriptions')
        .update({ ...subscriptionData, status: 'past_due' })
        .eq('provider_subscription_id', payload.data.id)
      break
    }

    default:
      console.log(`[webhook] Unhandled event: ${eventName}`)
  }

  return NextResponse.json({ received: true })
}
