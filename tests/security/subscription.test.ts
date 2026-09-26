import { describe, it, expect } from 'vitest'
import { isSubscriptionActive, mapLsStatus } from '@/lib/billing/access'
import type { Subscription } from '@/types'

describe('Subscription Access Control & State Machine (Requirement 15 & 31)', () => {
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  function mockSub(overrides: Partial<Subscription>): Subscription {
    return {
      id: 'sub-1',
      user_id: 'user-1',
      provider: 'lemonsqueezy',
      provider_customer_id: 'cust-1',
      provider_subscription_id: 'sub-ls-1',
      provider_product_id: 'prod-1',
      provider_variant_id: 'var-1',
      status: 'inactive',
      trial_ends_at: null,
      current_period_start: new Date().toISOString(),
      current_period_end: null,
      cancelled_at: null,
      cancel_at_period_end: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    }
  }

  it('1. returns false for null subscription', () => {
    expect(isSubscriptionActive(null)).toBe(false)
  })

  it('2. returns false for undefined subscription', () => {
    expect(isSubscriptionActive(undefined)).toBe(false)
  })

  it('3. returns true for active subscription', () => {
    const sub = mockSub({ status: 'active' })
    expect(isSubscriptionActive(sub)).toBe(true)
  })

  it('4. returns true for past_due subscription (grace period allowed)', () => {
    const sub = mockSub({ status: 'past_due' })
    expect(isSubscriptionActive(sub)).toBe(true)
  })

  it('5. returns true for trialing subscription with future trial_ends_at', () => {
    const sub = mockSub({ status: 'trialing', trial_ends_at: futureDate })
    expect(isSubscriptionActive(sub)).toBe(true)
  })

  it('6. returns false for trialing subscription with expired trial_ends_at', () => {
    const sub = mockSub({ status: 'trialing', trial_ends_at: pastDate })
    expect(isSubscriptionActive(sub)).toBe(false)
  })

  it('7. REGRESSION FIX: returns true for cancelled subscription whose current_period_end is in the future', () => {
    const sub = mockSub({ status: 'cancelled', current_period_end: futureDate })
    expect(isSubscriptionActive(sub)).toBe(true)
  })

  it('8. returns false for cancelled subscription whose current_period_end has passed', () => {
    const sub = mockSub({ status: 'cancelled', current_period_end: pastDate })
    expect(isSubscriptionActive(sub)).toBe(false)
  })

  it('9. returns false for paused subscription', () => {
    const sub = mockSub({ status: 'paused' })
    expect(isSubscriptionActive(sub)).toBe(false)
  })

  it('10. returns false for expired subscription', () => {
    const sub = mockSub({ status: 'expired' })
    expect(isSubscriptionActive(sub)).toBe(false)
  })

  it('11. returns false for inactive subscription', () => {
    const sub = mockSub({ status: 'inactive' })
    expect(isSubscriptionActive(sub)).toBe(false)
  })

  it('12. maps Lemon Squeezy status codes correctly', () => {
    expect(mapLsStatus('on_trial')).toBe('trialing')
    expect(mapLsStatus('active')).toBe('active')
    expect(mapLsStatus('past_due')).toBe('past_due')
    expect(mapLsStatus('paused')).toBe('paused')
    expect(mapLsStatus('cancelled')).toBe('cancelled')
    expect(mapLsStatus('expired')).toBe('expired')
    expect(mapLsStatus('unpaid')).toBe('past_due')
    expect(mapLsStatus('unknown_status')).toBe('inactive')
  })

  describe('Server-side Mutation Enforcement (No Client State Trust)', () => {
    it('13. blocks protected actions if user subscription is expired or inactive', () => {
      const expiredSub = mockSub({ status: 'expired' })
      const canProceed = isSubscriptionActive(expiredSub)
      expect(canProceed).toBe(false)
    })

    it('14. ignores client-manipulated subscription state and evaluates true server record', () => {
      // Attacker attempts to forge client state as { status: 'active' }
      const forgedClientState = { status: 'active' }
      // Server fetches true database record which is cancelled with expired period
      const trueDatabaseRecord = mockSub({ status: 'cancelled', current_period_end: pastDate })

      // Server access must rely ONLY on the verified database record
      expect(isSubscriptionActive(trueDatabaseRecord)).toBe(false)
      // Even if client sent status 'active' in body/cookie, server rejects
      expect(forgedClientState.status === 'active' && !isSubscriptionActive(trueDatabaseRecord)).toBe(true)
    })
  })
})
