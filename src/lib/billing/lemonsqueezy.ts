import crypto from 'crypto'

/**
 * Verify Lemon Squeezy webhook signature
 * Uses timingSafeEqual and safely checks buffer length to avoid throwing
 * https://docs.lemonsqueezy.com/api/webhooks
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret || typeof signature !== 'string') return false
  try {
    const hmac = crypto.createHmac('sha256', secret)
    const digest = hmac.update(rawBody).digest('hex')
    const digestBuf = Buffer.from(digest, 'hex')
    const sigBuf = Buffer.from(signature, 'hex')

    if (digestBuf.length !== sigBuf.length) {
      return false
    }

    return crypto.timingSafeEqual(digestBuf, sigBuf)
  } catch {
    return false
  }
}

/**
 * Lemon Squeezy webhook event types we handle
 */
export type LsEventType = 
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_cancelled'
  | 'subscription_resumed'
  | 'subscription_expired'
  | 'subscription_paused'
  | 'subscription_unpaused'
  | 'subscription_payment_success'
  | 'subscription_payment_failed'
  | 'subscription_payment_recovered'
  | 'subscription_trial_will_end'

export interface LsWebhookPayload {
  meta: {
    event_name: LsEventType
    custom_data?: {
      user_id?: string
    }
  }
  data: {
    id: string
    type: string
    attributes: LsSubscriptionAttributes
  }
}

export interface LsSubscriptionAttributes {
  store_id: number
  customer_id: number
  order_id: number
  product_id: number
  variant_id: number
  product_name: string
  variant_name: string
  status: string
  status_formatted: string
  pause: null | { mode: string }
  cancelled: boolean
  trial_ends_at: string | null
  billing_anchor: number
  urls: {
    update_payment_method: string
    customer_portal: string
    customer_portal_update_subscription: string
  }
  renews_at: string
  ends_at: string | null
  created_at: string
  updated_at: string
  test_mode: boolean
}
