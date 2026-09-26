'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  CreditCard,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { isSubscriptionActive } from '@/lib/billing/access'
import PageHeader from '@/components/dashboard/PageHeader'
import type { Subscription } from '@/types'

interface Props {
  subscription: Subscription | null
}

export default function BillingClient({ subscription: sub }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasAccess = isSubscriptionActive(sub)

  async function handleCheckout() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Failed to start checkout. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('An unexpected error occurred. Please check your network connection.')
      setLoading(false)
    }
  }

  const statusConfig: Record<string, { label: string; badgeClass: string }> = {
    active: {
      label: 'Active Pro',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    trialing: {
      label: 'Trial Active',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400',
    },
    past_due: {
      label: 'Payment Past Due',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400',
    },
    cancelled: {
      label: 'Cancelled',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400',
    },
    expired: {
      label: 'Expired',
      badgeClass: 'bg-muted text-muted-foreground border-border',
    },
  }

  const currentStatus = sub ? statusConfig[sub.status] || { label: sub.status, badgeClass: 'bg-muted text-muted-foreground border-border' } : { label: 'Inactive', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/60' }

  const features = [
    'Unlimited QR Codes & Locations',
    'Real-time customer feedback capture',
    '1-click Google 5-star review booster',
    'Full sentiment analytics & trend reports',
    'Negative feedback alerts & resolution workflow',
    'Exportable QR code high-res prints',
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Subscription & Billing"
        description="Manage your subscription tier, billing period, and Lemon Squeezy payment portal."
      />

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Subscription Card */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-2xs overflow-hidden">
        {/* Card Header with Price & Tier */}
        <div className="p-6 sm:p-8 border-b border-border/60 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-xl font-bold tracking-tight text-foreground">ReviewFlow Pro</span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${currentStatus.badgeClass}`}>
                  {currentStatus.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                All-in-one reputation booster and customer feedback platform.
              </p>
            </div>

            <div className="flex items-baseline gap-1 bg-background px-4 py-2 rounded-xl border border-border/70 shadow-2xs self-start">
              <span className="text-3xl font-extrabold tracking-tight text-foreground">299 грн</span>
              <span className="text-xs text-muted-foreground font-medium">/ month</span>
            </div>
          </div>
        </div>

        {/* Subscription Dates & Notices */}
        {sub && (
          <div className="px-6 sm:px-8 py-4 bg-muted/10 border-b border-border/60 text-xs sm:text-sm space-y-2.5">
            {sub.trial_ends_at && sub.status === 'trialing' && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Free Trial Ends:</span>
                <span className="font-semibold text-foreground">
                  {format(new Date(sub.trial_ends_at), 'MMMM d, yyyy')}
                </span>
              </div>
            )}

            {sub.current_period_end && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span>{sub.cancel_at_period_end ? 'Access continues until:' : 'Next billing renewal:'}</span>
                <span className="font-semibold text-foreground">
                  {format(new Date(sub.current_period_end), 'MMMM d, yyyy')}
                </span>
              </div>
            )}

            {sub.cancel_at_period_end && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  Your subscription cancellation is scheduled. Full access continues until the end of your prepaid period.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Included Features Grid */}
        <div className="p-6 sm:p-8">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Included in your plan:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-2.5 text-xs sm:text-sm text-foreground">
                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/60">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="pt-6 border-t border-border/60">
            {!sub || !hasAccess ? (
              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-zinc-900 text-white font-semibold text-sm hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Redirecting to Checkout…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Start 7-Day Free Trial — 299 грн/month</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-muted-foreground text-center">
                  7 days free. Cancel anytime before trial ends. Secured by Lemon Squeezy.
                </p>
              </div>
            ) : sub.provider_subscription_id ? (
              <div className="space-y-3">
                <a
                  href="https://app.lemonsqueezy.com/my-orders"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-2xs"
                >
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span>Manage Subscription & Invoices</span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </a>
                <p className="text-[11px] text-muted-foreground text-center">
                  Update payment method, download VAT invoices, or manage renewals via the Lemon Squeezy portal.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-zinc-900 text-white font-semibold text-sm hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Redirecting…</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Subscribe to ReviewFlow Pro — 299 грн/month</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
