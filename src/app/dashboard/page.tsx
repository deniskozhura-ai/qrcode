import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6">
      <p className="text-sm text-zinc-500 font-medium mb-2">{label}</p>
      <p className="text-3xl font-bold text-zinc-900 tracking-tight">{value}</p>
      {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
    </div>
  )
}

import { getUserSubscription } from '@/lib/billing/server'
import { isSubscriptionActive } from '@/lib/billing/access'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sub = await getUserSubscription()
  if (!isSubscriptionActive(sub)) {
    redirect('/dashboard/billing?notice=subscription_required')
  }

  const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).maybeSingle()
  const { data: businesses } = await supabase.from('businesses').select('id, name').eq('owner_id', user.id).order('created_at', { ascending: false }).limit(1)
  const business = businesses?.[0]

  if (!business) redirect('/dashboard/settings/business')

  const bid = business.id

  // Parallel stats
  const [scansRes, feedbackRes, googleRes, unresolvedRes, recentRes, ratingRes] = await Promise.all([
    supabase.from('analytics_events').select('*', { count: 'exact', head: true }).eq('business_id', bid).eq('event_type', 'qr_scan'),
    supabase.from('feedback').select('*', { count: 'exact', head: true }).eq('business_id', bid),
    supabase.from('analytics_events').select('*', { count: 'exact', head: true }).eq('business_id', bid).eq('event_type', 'google_review_clicked'),
    supabase.from('feedback').select('*', { count: 'exact', head: true }).eq('business_id', bid).eq('status', 'new'),
    supabase.from('feedback').select('id, rating, category, message, status, created_at, qr_codes(name)').eq('business_id', bid).order('created_at', { ascending: false }).limit(5),
    supabase.from('feedback').select('rating').eq('business_id', bid),
  ])

  const totalScans = scansRes.count ?? 0
  const totalFeedback = feedbackRes.count ?? 0
  const googleClicks = googleRes.count ?? 0
  const unresolved = unresolvedRes.count ?? 0
  const recentFeedback = recentRes.data ?? []
  const avgRating = ratingRes.data && ratingRes.data.length > 0
    ? (ratingRes.data.reduce((s, r) => s + r.rating, 0) / ratingRes.data.length).toFixed(1)
    : '—'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = profile?.name?.split(' ')[0] || 'there'

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">{greeting}, {firstName} 👋</h1>
        <p className="text-zinc-500 mt-1 text-sm">Here&apos;s what&apos;s happening with your customer feedback.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Scans" value={totalScans.toLocaleString()} />
        <StatCard label="Feedback" value={totalFeedback.toLocaleString()} />
        <StatCard label="Average Rating" value={avgRating} sub={`${totalFeedback} responses`} />
        <StatCard label="Google Clicks" value={googleClicks.toLocaleString()} />
      </div>

      {/* Unresolved issues banner */}
      {unresolved > 0 && (
        <Link href="/dashboard/feedback?filter=unresolved" className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-8 hover:bg-amber-100 transition-colors">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-900">{unresolved} unresolved issue{unresolved > 1 ? 's' : ''}</p>
            <p className="text-xs text-amber-700">Click to view and resolve customer feedback</p>
          </div>
          <svg className="w-4 h-4 text-amber-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}

      {/* Recent feedback */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-zinc-100">
          <h2 className="font-semibold text-zinc-900">Recent Feedback</h2>
          <Link href="/dashboard/feedback" className="text-sm text-zinc-500 hover:text-zinc-900 font-medium">
            View all →
          </Link>
        </div>
        {recentFeedback.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-zinc-400 text-sm">No feedback yet.</p>
            <p className="text-zinc-400 text-xs mt-1">Your first customer response will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {recentFeedback.map((f) => (
              <div key={f.id} className="px-6 py-4 flex items-start gap-4">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${f.rating >= 4 ? 'bg-green-100 text-green-700' : f.rating === 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                  {f.rating}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {f.category && <span className="text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">{f.category}</span>}
                    {f.status === 'new' && f.rating <= 3 && (
                      <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Needs attention</span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-600 truncate">{f.message || '(no message)'}</p>
                </div>
                <p className="text-xs text-zinc-400 shrink-0">{format(new Date(f.created_at), 'MMM d')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
