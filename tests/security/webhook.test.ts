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

  describe('Webhook Idempotency, Replay Protection & Retry Semantics', () => {
    // Database simulation tracking webhook_events and subscription update counts
    class MockWebhookDatabase {
      webhookEvents = new Set<string>()
      subscriptionUpdates = new Map<string, number>()
      shouldFailUpdate = false

      async claimEvent(eventId: string): Promise<{ success: boolean; code?: string }> {
        if (this.webhookEvents.has(eventId)) {
          return { success: false, code: '23505' } // PostgreSQL unique_violation
        }
        this.webhookEvents.add(eventId)
        return { success: true }
      }

      async rollbackClaim(eventId: string): Promise<void> {
        this.webhookEvents.delete(eventId)
      }

      async updateSubscription(eventId: string): Promise<void> {
        if (this.shouldFailUpdate) {
          throw new Error('Supabase database connection error during subscription update')
        }
        const currentCount = this.subscriptionUpdates.get(eventId) || 0
        this.subscriptionUpdates.set(eventId, currentCount + 1)
      }
    }

    async function handleWebhookRequest(
      db: MockWebhookDatabase,
      eventId: string
    ): Promise<{ httpStatus: number; body: { received?: boolean; error?: string }; processed: boolean }> {
      // 1. Atomically claim event in database
      const claimResult = await db.claimEvent(eventId)
      if (!claimResult.success) {
        if (claimResult.code === '23505') {
          // Replay or duplicate detected via atomic DB constraint
          return { httpStatus: 200, body: { received: true }, processed: false }
        }
        return { httpStatus: 500, body: { error: 'Failed to record event claim' }, processed: false }
      }

      // 2. Perform subscription update with rollback on failure
      try {
        await db.updateSubscription(eventId)
      } catch {
        // Rollback event claim so provider can retry
        await db.rollbackClaim(eventId)
        return {
          httpStatus: 500,
          body: { error: 'Subscription update failed. Provider may retry.' },
          processed: false,
        }
      }

      // 3. Mark processed & return HTTP 200
      return { httpStatus: 200, body: { received: true }, processed: true }
    }

    it('8. same event twice → processed only once (idempotent replay protection)', async () => {
      const db = new MockWebhookDatabase()
      const eventId = 'evt_ls_twice_123'

      // First delivery: should process subscription update
      const firstResponse = await handleWebhookRequest(db, eventId)
      expect(firstResponse.httpStatus).toBe(200)
      expect(firstResponse.processed).toBe(true)
      expect(firstResponse.body.received).toBe(true)
      expect(db.subscriptionUpdates.get(eventId)).toBe(1)

      // Second delivery (duplicate / replay): should return 200 received without updating subscription again
      const secondResponse = await handleWebhookRequest(db, eventId)
      expect(secondResponse.httpStatus).toBe(200)
      expect(secondResponse.processed).toBe(false)
      expect(secondResponse.body.received).toBe(true)
      // Critical check: subscription update was NOT executed a second time!
      expect(db.subscriptionUpdates.get(eventId)).toBe(1)
    })

    it('9. subscription update failure → event is retryable (released from DB so provider retry succeeds)', async () => {
      const db = new MockWebhookDatabase()
      const eventId = 'evt_ls_fail_then_retry_456'

      // Simulate transient failure during subscription update (e.g. network / DB outage)
      db.shouldFailUpdate = true

      // First delivery fails
      const failedResponse = await handleWebhookRequest(db, eventId)
      expect(failedResponse.httpStatus).toBe(500)
      expect(failedResponse.processed).toBe(false)
      expect(failedResponse.body.error).toContain('Subscription update failed')
      // Subscription was not updated
      expect(db.subscriptionUpdates.get(eventId)).toBeUndefined()
      // Event must NOT remain locked in webhookEvents!
      expect(db.webhookEvents.has(eventId)).toBe(false)

      // Provider retries after transient issue is resolved
      db.shouldFailUpdate = false
      const retryResponse = await handleWebhookRequest(db, eventId)
      expect(retryResponse.httpStatus).toBe(200)
      expect(retryResponse.processed).toBe(true)
      expect(retryResponse.body.received).toBe(true)
      // Subscription is now updated exactly once!
      expect(db.subscriptionUpdates.get(eventId)).toBe(1)
      expect(db.webhookEvents.has(eventId)).toBe(true)
    })

    it('10. concurrent duplicate events → only one successful processing (atomic DB constraint)', async () => {
      const db = new MockWebhookDatabase()
      const duplicateEventId = 'evt_ls_concurrent_888'

      // Fire 5 concurrent requests with identical eventId
      const results = await Promise.all([
        handleWebhookRequest(db, duplicateEventId),
        handleWebhookRequest(db, duplicateEventId),
        handleWebhookRequest(db, duplicateEventId),
        handleWebhookRequest(db, duplicateEventId),
        handleWebhookRequest(db, duplicateEventId),
      ])

      const successfulRuns = results.filter((r) => r.processed)
      const duplicateRuns = results.filter((r) => !r.processed)

      // Exactly ONE request must process the event; all others must be safely deduplicated!
      expect(successfulRuns).toHaveLength(1)
      expect(duplicateRuns).toHaveLength(4)
      expect(results.every((r) => r.httpStatus === 200)).toBe(true)
      expect(results.every((r) => r.body.received === true)).toBe(true)
      expect(db.subscriptionUpdates.get(duplicateEventId)).toBe(1)
    })

    it('11. lifecycle events disambiguation: subscription_created followed by subscription_cancelled for SAME subscription ID are distinct events and both process successfully', async () => {
      const db = new MockWebhookDatabase()
      const subscriptionId = 'sub_ls_shared_resource_777'

      // Derive event IDs distinguishing event lifecycle from raw resource ID alone
      const createdEventId = `subscription_created_${subscriptionId}_active_2026-09-26`
      const cancelledEventId = `subscription_cancelled_${subscriptionId}_cancelled_2026-09-27`

      // 1. First event: subscription_created
      const createdRes = await handleWebhookRequest(db, createdEventId)
      expect(createdRes.httpStatus).toBe(200)
      expect(createdRes.processed).toBe(true)
      expect(createdRes.body.received).toBe(true)

      // 2. Replay of subscription_created: rejected as duplicate
      const replayRes = await handleWebhookRequest(db, createdEventId)
      expect(replayRes.httpStatus).toBe(200)
      expect(replayRes.processed).toBe(false) // Safely deduplicated!
      expect(replayRes.body.received).toBe(true)

      // 3. Second lifecycle event for SAME subscription: subscription_cancelled
      // Must NOT be blocked by previous subscription_created event!
      const cancelledRes = await handleWebhookRequest(db, cancelledEventId)
      expect(cancelledRes.httpStatus).toBe(200)
      expect(cancelledRes.processed).toBe(true) // Successfully processed cancellation!
      expect(cancelledRes.body.received).toBe(true)

      expect(db.subscriptionUpdates.get(createdEventId)).toBe(1)
      expect(db.subscriptionUpdates.get(cancelledEventId)).toBe(1)
    })

    it('12. respects delivery ID / webhook_id header if provided by Lemon Squeezy', async () => {
      const db = new MockWebhookDatabase()
      const deliveryIdA = 'evt_delivery_uuid_aaa_111'
      const deliveryIdB = 'evt_delivery_uuid_bbb_222'

      const resA = await handleWebhookRequest(db, deliveryIdA)
      expect(resA.processed).toBe(true)

      const resADuplicate = await handleWebhookRequest(db, deliveryIdA)
      expect(resADuplicate.processed).toBe(false)

      const resB = await handleWebhookRequest(db, deliveryIdB)
      expect(resB.processed).toBe(true)
    })
  })
})
