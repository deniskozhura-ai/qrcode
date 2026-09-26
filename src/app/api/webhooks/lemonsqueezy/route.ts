import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { verifyWebhookSignature } from '@/lib/billing/lemonsqueezy'
import { mapLsStatus } from '@/lib/billing/access'
import { LemonSqueezyWebhookPayloadSchema } from '@/lib/validations'

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
    console.error('[webhook] LEMONSQUEEZY_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  // 1. Signature Verification with Constant-Time Comparison
  if (!signature || !verifyWebhookSignature(rawBody, signature, secret)) {
    console.warn('[webhook] Invalid or missing signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // 2. Parse JSON
  let jsonBody: unknown
  try {
    jsonBody = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  // 3. Validate Payload Structure via Zod
  const parsed = LemonSqueezyWebhookPayloadSchema.safeParse(jsonBody)
  if (!parsed.success) {
    console.warn('[webhook] Malformed payload:', parsed.error.format())
    return NextResponse.json({ error: 'Malformed webhook payload' }, { status: 400 })
  }

  const payload = parsed.data
  const eventName = payload.meta.event_name
  const eventId = payload.data.id
  const attrs = payload.data.attributes
  const userId = payload.meta.custom_data?.user_id

  const db = getServiceClient()

  // 4. Atomically claim/check event (Database UNIQUE constraint eliminates race conditions)
  const { error: idempotencyError } = await db.from('webhook_events').insert({
    provider: 'lemonsqueezy',
    event_id: eventId,
    event_type: eventName,
  })

  if (idempotencyError) {
    // Unique violation (Postgres error 23505) indicates duplicate event
    if (
      idempotencyError.code === '23505' ||
      idempotencyError.message?.toLowerCase().includes('duplicate') ||
      idempotencyError.message?.toLowerCase().includes('unique')
    ) {
      console.log(`[webhook] Duplicate event ${eventId} safely ignored via atomic constraint`)
      return NextResponse.json({ received: true })
    }
    console.error('[webhook] Error recording event idempotency:', idempotencyError)
    return NextResponse.json({ error: 'Failed to record event claim' }, { status: 500 })
  }

  // 5. Construct Normalized Subscription Data
  const subscriptionData = {
    provider: 'lemonsqueezy',
    provider_subscription_id: String(payload.data.id),
    provider_product_id: String(attrs.product_id),
    provider_variant_id: String(attrs.variant_id),
    provider_customer_id: String(attrs.customer_id),
    status: mapLsStatus(attrs.status),
    trial_ends_at: attrs.trial_ends_at ?? null,
    current_period_start: attrs.created_at ?? new Date().toISOString(),
    current_period_end: attrs.renews_at ?? attrs.ends_at ?? null,
    cancelled_at: attrs.cancelled ? new Date().toISOString() : null,
    cancel_at_period_end: Boolean(attrs.cancelled),
    updated_at: new Date().toISOString(),
  }

  // 6. Update Subscription safely with verification & rollback on failure
  try {
    switch (eventName) {
      case 'subscription_created': {
        if (!userId) {
          console.error('[webhook] subscription_created: missing user_id in custom_data')
          throw new Error('Missing user_id in webhook custom_data')
        }

        // Verify user actually exists in the system (avoid arbitrary/forged user hijacking)
        const { data: profile, error: profileError } = await db
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle()

        if (profileError) {
          throw new Error(`Database error fetching profile: ${profileError.message}`)
        }

        if (!profile) {
          console.error(`[webhook] User ${userId} does not exist in profiles`)
          throw new Error(`User ${userId} not found in profiles`)
        }

        const { error: upsertError } = await db.from('subscriptions').upsert(
          {
            user_id: userId,
            ...subscriptionData,
          },
          { onConflict: 'user_id' }
        )

        if (upsertError) {
          throw new Error(`Failed to upsert subscription: ${upsertError.message}`)
        }

        console.log(`[webhook] Subscription successfully created for user ${userId}`)
        break
      }

      case 'subscription_updated':
      case 'subscription_resumed':
      case 'subscription_unpaused':
      case 'subscription_payment_success':
      case 'subscription_payment_recovered':
      case 'subscription_trial_will_end': {
        const { error: updateError } = await db
          .from('subscriptions')
          .update(subscriptionData)
          .eq('provider_subscription_id', String(payload.data.id))

        if (updateError) {
          throw new Error(`Failed to update subscription: ${updateError.message}`)
        }
        break
      }

      case 'subscription_cancelled': {
        const { error: updateError } = await db
          .from('subscriptions')
          .update({
            ...subscriptionData,
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancel_at_period_end: true,
          })
          .eq('provider_subscription_id', String(payload.data.id))

        if (updateError) {
          throw new Error(`Failed to cancel subscription: ${updateError.message}`)
        }
        break
      }

      case 'subscription_expired': {
        const { error: updateError } = await db
          .from('subscriptions')
          .update({ ...subscriptionData, status: 'expired' })
          .eq('provider_subscription_id', String(payload.data.id))

        if (updateError) {
          throw new Error(`Failed to expire subscription: ${updateError.message}`)
        }
        break
      }

      case 'subscription_paused': {
        const { error: updateError } = await db
          .from('subscriptions')
          .update({ ...subscriptionData, status: 'paused' })
          .eq('provider_subscription_id', String(payload.data.id))

        if (updateError) {
          throw new Error(`Failed to pause subscription: ${updateError.message}`)
        }
        break
      }

      case 'subscription_payment_failed': {
        const { error: updateError } = await db
          .from('subscriptions')
          .update({ ...subscriptionData, status: 'past_due' })
          .eq('provider_subscription_id', String(payload.data.id))

        if (updateError) {
          throw new Error(`Failed to record payment failure: ${updateError.message}`)
        }
        break
      }

      default:
        console.log(`[webhook] Unhandled or informative event: ${eventName}`)
    }
  } catch (error) {
    // CRITICAL: Subscription processing failed!
    // Release claimed event from webhook_events so the provider can retry.
    console.error(`[webhook] Subscription processing failed for event ${eventId}:`, error)
    await db
      .from('webhook_events')
      .delete()
      .eq('provider', 'lemonsqueezy')
      .eq('event_id', eventId)

    return NextResponse.json(
      { error: 'Subscription update failed. Provider may retry.' },
      { status: 500 }
    )
  }

  // 7. Mark webhook as successfully processed (event remains recorded in webhook_events)
  // 8. Return success
  return NextResponse.json({ received: true })
}
