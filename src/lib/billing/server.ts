import { createClient } from '@/lib/supabase/server'
import { isSubscriptionActive } from '@/lib/billing/access'
import type { Subscription } from '@/types'

/**
 * Get subscription for current user — SERVER ONLY
 */
export async function getUserSubscription(): Promise<Subscription | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[getUserSubscription] query error:', error)
    return null
  }

  return data
}

/**
 * Central access control — SERVER ONLY
 */
export async function canAccessDashboard(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const sub = await getUserSubscription()
  return isSubscriptionActive(sub)
}
