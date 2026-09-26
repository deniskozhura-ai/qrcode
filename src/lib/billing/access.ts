import type { SubscriptionStatus, Subscription } from '@/types'

/**
 * Map Lemon Squeezy subscription status to ReviewFlow internal status
 * Pure function — no Next.js dependencies, safe to import anywhere
 */
export function mapLsStatus(lsStatus: string): SubscriptionStatus {
  const map: Record<string, SubscriptionStatus> = {
    'on_trial': 'trialing',
    'active': 'active',
    'past_due': 'past_due',
    'paused': 'paused',
    'cancelled': 'cancelled',
    'expired': 'expired',
    'unpaid': 'past_due',
  }
  return map[lsStatus] ?? 'inactive'
}

/**
 * Check if a subscription allows dashboard access
 * Pure function — safe to import in Client Components & Server
 * 
 * Rules:
 * - null/undefined: false
 * - active: true
 * - past_due: true (grace period)
 * - trialing: true if trial has not expired, false if expired
 * - cancelled: true if current period has not ended yet, false if period expired
 * - paused: false
 * - expired: false
 * - inactive: false
 */
export function isSubscriptionActive(sub: Subscription | null | undefined): boolean {
  if (!sub || !sub.status) return false

  const now = new Date()

  switch (sub.status) {
    case 'active':
      return true

    case 'past_due':
      return true

    case 'trialing':
      if (!sub.trial_ends_at) return true
      return new Date(sub.trial_ends_at) > now

    case 'cancelled':
      if (!sub.current_period_end) return false
      return new Date(sub.current_period_end) > now

    case 'paused':
    case 'expired':
    case 'inactive':
    default:
      return false
  }
}
