// Core domain types for ReviewFlow

export type SubscriptionStatus = 
  | 'trialing'
  | 'active' 
  | 'past_due'
  | 'paused'
  | 'cancelled'
  | 'expired'
  | 'inactive'

export interface Profile {
  id: string
  email: string
  name: string | null
  notify_negative_feedback: boolean
  notify_weekly_summary: boolean
  created_at: string
  updated_at: string
}

export interface Business {
  id: string
  owner_id: string
  name: string
  slug: string
  logo_url: string | null
  brand_color: string
  google_review_url: string | null
  timezone: string
  address: string | null
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface QrCode {
  id: string
  business_id: string
  name: string
  slug: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Feedback {
  id: string
  business_id: string
  qr_code_id: string | null
  rating: number
  category: string | null
  message: string | null
  customer_email: string | null
  status: 'new' | 'in_progress' | 'resolved'
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  provider: string
  provider_customer_id: string | null
  provider_subscription_id: string | null
  provider_product_id: string | null
  provider_variant_id: string | null
  status: SubscriptionStatus
  trial_ends_at: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancelled_at: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export interface AnalyticsEvent {
  id: string
  business_id: string
  qr_code_id: string | null
  event_type: 'qr_scan' | 'rating_submitted' | 'feedback_submitted' | 'feedback_copied' | 'google_review_clicked'
  created_at: string
}

export interface DashboardStats {
  totalScans: number
  totalFeedback: number
  averageRating: number
  googleClicks: number
  unresolvedCount: number
}
