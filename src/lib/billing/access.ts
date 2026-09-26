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
 * Pure function — safe to import in Client Components
 */
export function isSubscriptionActive(sub: Subscription | null): boolean {
  if (!sub) return false

  const activeStatuses: SubscriptionStatus[] = ['trialing', 'active', 'past_due']

  if (!activeStatuses.includes(sub.status)) return false

  // If cancelled, check if current period hasn't ended yet
  if (sub.status === 'cancelled' && sub.current_period_end) {
    return new Date(sub.current_period_end) > new Date()
  }

  // If trialing, check trial end date
  if (sub.status === 'trialing' && sub.trial_ends_at) {
    return new Date(sub.trial_ends_at) > new Date()
  }

  return true
}
