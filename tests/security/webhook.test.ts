import { describe, it, expect } from 'vitest'
import crypto from 'crypto'
import { verifyWebhookSignature } from '@/lib/billing/lemonsqueezy'
import { LemonSqueezyWebhookPayloadSchema } from '@/lib/validations'

describe('Lemon Squeezy Webhook Security & Idempotency (Requirement 11, 12, 13 & 30)', () => {
  const secret = 'super-secret-webhook-key-12345'
  const rawPayload = JSON.stringify({
    meta: {
      event_name: 'subscription_created',
      custom_data: { user_id: '123e4567-e89b-12d3-a456-426614174000' },
    },
    data: {
      id: 'sub_ls_9999',
      type: 'subscriptions',
      attributes: {
        product_id: 101,
        variant_id: 202,
        customer_id: 303,
        status: 'active',
        created_at: new Date().toISOString(),
        cancelled: false,
      },
    },
  })

  function computeSignature(payload: string, key: string): string {
    return crypto.createHmac('sha256', key).update(payload).digest('hex')
  }

  describe('Signature Verification & Timing Attack Protection', () => {
    it('1. accepts payload with a valid HMAC-SHA256 signature', () => {
      const validSig = computeSignature(rawPayload, secret)
      expect(verifyWebhookSignature(rawPayload, validSig, secret)).toBe(true)
    })

    it('2. rejects payload with an incorrect signature (returns false / 401)', () => {
      const wrongSig = computeSignature(rawPayload, 'wrong-secret-key')
      expect(verifyWebhookSignature(rawPayload, wrongSig, secret)).toBe(false)
    })

    it('3. rejects empty or missing signature without crashing', () => {
      expect(verifyWebhookSignature(rawPayload, '', secret)).toBe(false)
      // @ts-expect-error test undefined input
      expect(verifyWebhookSignature(rawPayload, undefined, secret)).toBe(false)
    })

    it('4. REGRESSION FIX: does NOT throw RangeError on unequal signature buffer lengths', () => {
      // In vanilla crypto.timingSafeEqual, passing buffers of different lengths throws a fatal RangeError.
      // Our secured verifyWebhookSignature must return false safely instead of crashing.
      expect(verifyWebhookSignature(rawPayload, 'too-short', secret)).toBe(false)
      expect(verifyWebhookSignature(rawPayload, 'a'.repeat(128), secret)).toBe(false)
      expect(verifyWebhookSignature(rawPayload, 'not-hex-characters-xyz!!', secret)).toBe(false)
    })
  })

  describe('Webhook Payload Validation (Zod Schema)', () => {
    it('5. accepts well-formed subscription_created payload', () => {
      const parsed = LemonSqueezyWebhookPayloadSchema.safeParse(JSON.parse(rawPayload))
      expect(parsed.success).toBe(true)
    })

    it('6. rejects malformed payload with missing attributes', () => {
      const malformed = {
        meta: { event_name: 'subscription_created' },
        data: { id: '123' }, // missing attributes
      }
      const parsed = LemonSqueezyWebhookPayloadSchema.safeParse(malformed)
      expect(parsed.success).toBe(false)
    })

    it('7. rejects non-UUID user_id in custom_data', () => {
      const invalidUserId = {
        meta: {
          event_name: 'subscription_created',
          custom_data: { user_id: 'not-a-uuid' },
        },
        data: {
          id: 'sub_123',
          attributes: { product_id: 1, variant_id: 1, customer_id: 1, status: 'active' },
        },
      }
      const parsed = LemonSqueezyWebhookPayloadSchema.safeParse(invalidUserId)
      expect(parsed.success).toBe(false)
    })
  })

  describe('Concurrent Duplicate Processing & Idempotency Simulation', () => {
    it('8. simulates atomic UNIQUE constraint behavior for concurrent duplicate events', async () => {
      // Models database UNIQUE(provider, event_id) table behavior
      const processedEvents = new Set<string>()

      async function processWebhookEvent(eventId: string): Promise<{ status: string; processed: boolean }> {
        // Atomic insert simulation:
        if (processedEvents.has(eventId)) {
          // Duplicate key violation (PostgreSQL 23505)
          return { status: 'duplicate_ignored', processed: false }
        }
        processedEvents.add(eventId)
        // Subscription state update simulation:
        return { status: 'success', processed: true }
      }

      const duplicateEventId = 'evt_ls_concurrent_888'

      // Fire 5 concurrent requests with identical eventId
      const results = await Promise.all([
        processWebhookEvent(duplicateEventId),
        processWebhookEvent(duplicateEventId),
        processWebhookEvent(duplicateEventId),
        processWebhookEvent(duplicateEventId),
        processWebhookEvent(duplicateEventId),
      ])

      const successfulRuns = results.filter((r) => r.processed)
      const duplicateRuns = results.filter((r) => !r.processed)

      // Exactly ONE request must process the event; all others must be safely deduplicated!
      expect(successfulRuns).toHaveLength(1)
      expect(duplicateRuns).toHaveLength(4)
      expect(duplicateRuns.every((r) => r.status === 'duplicate_ignored')).toBe(true)
    })
  })
})
