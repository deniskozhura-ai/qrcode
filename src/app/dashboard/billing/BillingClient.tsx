'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import type { Subscription } from '@/types'
import { isSubscriptionActive } from '@/lib/billing/access'

interface Props {
  subscription: Subscription | null
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  trialing: { label: 'Trial Active', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  past_due: { label: 'Payment Due', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', color: 'bg-zinc-100 text-zinc-600' },
  expired: { label: 'Expired', color: 'bg-zinc-100 text-zinc-500' },
  paused: { label: 'Paused', color: 'bg-yellow-100 text-yellow-700' },
  inactive: { label: 'Inactive', color: 'bg-zinc-100 text-zinc-500' },
}

export default function BillingClient({ subscription: sub }: Props) {
  const [loading, setLoading] = useState(false)

  const statusInfo = STATUS_LABELS[sub?.status ?? 'inactive'] ?? STATUS_LABELS.inactive
  const hasAccess = sub ? isSubscriptionActive(sub) : false

  async function handleCheckout() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Could not start checkout. Please try again.')
      }
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Billing</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your subscription and payment details.</p>
      </div>

      {/* Payment failure warning */}
      {sub?.status === 'past_due' && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-800">⚠️ Your payment could not be processed.</p>
          <p className="text-sm text-red-600 mt-1">Please update your payment method to continue using ReviewFlow.</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="p-6 border-b border-zinc-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-lg font-bold text-zinc-900">ReviewFlow</p>
              <p className="text-zinc-500 text-sm">Everything included · Unlimited QR codes</p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight text-zinc-900">299 грн</span>
            <span className="text-zinc-400 font-medium">/month</span>
          </div>
        </div>

        {sub && (
          <div className="px-6 py-4 space-y-3 border-b border-zinc-100 text-sm">
            {sub.trial_ends_at && sub.status === 'trialing' && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Trial ends</span>
                <span className="font-medium text-zinc-900">{format(new Date(sub.trial_ends_at), 'MMM d, yyyy')}</span>
              </div>
            )}
            {sub.current_period_end && (
              <div className="flex justify-between">
                <span className="text-zinc-500">{sub.cancel_at_period_end ? 'Access until' : 'Next billing date'}</span>
                <span className="font-medium text-zinc-900">{format(new Date(sub.current_period_end), 'MMM d, yyyy')}</span>
              </div>
            )}
            {sub.cancel_at_period_end && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                Your subscription is cancelled. Access continues until the end of the billing period.
              </p>
            )}
          </div>
        )}

        <div className="p-6">
          {!sub || !hasAccess ? (
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-3 bg-zinc-900 text-white font-semibold rounded-xl hover:bg-zinc-700 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Redirecting…' : 'Start Free Trial — 299 грн/month'}
            </button>
          ) : sub.provider_subscription_id ? (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400 text-center">Use the Lemon Squeezy portal to manage your subscription, update payment method, or download invoices.</p>
              <a
                href={`https://app.lemonsqueezy.com/my-orders`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 text-center border border-zinc-200 text-zinc-700 font-medium rounded-xl hover:bg-zinc-50 transition-colors text-sm"
              >
                Manage Subscription →
              </a>
            </div>
          ) : (
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-3 bg-zinc-900 text-white font-semibold rounded-xl hover:bg-zinc-700 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Redirecting…' : 'Subscribe — 299 грн/month'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
