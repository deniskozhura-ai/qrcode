import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import { getUserSubscription } from '@/lib/billing/server'
import { isSubscriptionActive } from '@/lib/billing/access'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sub = await getUserSubscription()
  if (!isSubscriptionActive(sub)) {
    redirect('/dashboard/billing?notice=subscription_required')
  }

  const { data: businesses } = await supabase.from('businesses').select('id').eq('owner_id', user.id).order('created_at', { ascending: false }).limit(1)
  const business = businesses?.[0]
  if (!business) redirect('/dashboard/settings/business')

  const bid = business.id

  const [feedbackRes, eventsRes] = await Promise.all([
    supabase.from('feedback').select('rating, category, created_at, status').eq('business_id', bid).order('created_at'),
    supabase.from('analytics_events').select('event_type, created_at').eq('business_id', bid),
  ])

  const feedback = feedbackRes.data ?? []
  const events = eventsRes.data ?? []

  // Rating distribution
  const ratingDist = [5,4,3,2,1].map(r => ({
    rating: r,
    count: feedback.filter(f => f.rating === r).length,
  }))
  const maxCount = Math.max(...ratingDist.map(d => d.count), 1)

  // Category breakdown (negative only)
  const negativeFeedback = feedback.filter(f => f.rating <= 3 && f.category)
  const catCounts: Record<string, number> = {}
  negativeFeedback.forEach(f => { catCounts[f.category!] = (catCounts[f.category!] ?? 0) + 1 })
  const topCategories = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxCat = Math.max(...topCategories.map(([,c]) => c), 1)

  // Totals
  const totalScans = events.filter(e => e.event_type === 'qr_scan').length
  const googleClicks = events.filter(e => e.event_type === 'google_review_clicked').length
  const feedbackCopied = events.filter(e => e.event_type === 'feedback_copied').length
  const avgRating = feedback.length > 0
    ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(2)
    : '—'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Analytics</h1>
        <p className="text-zinc-500 text-sm mt-1">All time overview of your customer feedback.</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total QR Scans', value: totalScans },
          { label: 'Total Feedback', value: feedback.length },
          { label: 'Average Rating', value: avgRating },
          { label: 'Google Clicks', value: googleClicks },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-zinc-200 p-5">
            <p className="text-xs text-zinc-500 font-medium mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-zinc-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating distribution */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <h3 className="font-semibold text-zinc-900 mb-5">Rating Distribution</h3>
          {feedback.length === 0 ? (
            <p className="text-zinc-400 text-sm">No feedback yet.</p>
          ) : (
            <div className="space-y-3">
              {ratingDist.map(({ rating, count }) => (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-600 w-6">{rating}★</span>
                  <div className="flex-1 bg-zinc-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(count / maxCount) * 100}%`,
                        backgroundColor: rating >= 4 ? '#22c55e' : rating === 3 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                  <span className="text-sm text-zinc-400 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top negative categories */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <h3 className="font-semibold text-zinc-900 mb-1">Top Issues</h3>
          <p className="text-xs text-zinc-400 mb-5">Categories mentioned in 1–3 star feedback</p>
          {topCategories.length === 0 ? (
            <p className="text-zinc-400 text-sm">No negative feedback with categories yet.</p>
          ) : (
            <div className="space-y-3">
              {topCategories.map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-sm text-zinc-600 w-28 truncate capitalize">{cat.replace('_', ' ')}</span>
                  <div className="flex-1 bg-zinc-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full bg-red-400 rounded-full transition-all duration-700"
                      style={{ width: `${(count / maxCat) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-zinc-400 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
