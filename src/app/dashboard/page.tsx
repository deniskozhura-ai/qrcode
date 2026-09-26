import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  QrCode,
  MessageSquare,
  Star,
  ExternalLink,
  AlertTriangle,
  ArrowRight,
  Plus,
  Sparkles,
} from 'lucide-react'
import { getUserSubscription } from '@/lib/billing/server'
import { isSubscriptionActive } from '@/lib/billing/access'
import StatCard from '@/components/dashboard/StatCard'
import EmptyState from '@/components/dashboard/EmptyState'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sub = await getUserSubscription()
  if (!isSubscriptionActive(sub)) {
    redirect('/dashboard/billing?notice=subscription_required')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .maybeSingle()

  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const business = businesses?.[0]
  if (!business) redirect('/dashboard/settings/business')

  const bid = business.id

  // Parallel database queries
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

  const ratingsList = ratingRes.data ?? []
  const avgRating = ratingsList.length > 0
    ? (ratingsList.reduce((s, r) => s + r.rating, 0) / ratingsList.length).toFixed(1)
    : '—'

  // Rating distribution counts
  const ratingDistribution = [5, 4, 3, 2, 1].map((r) => ({
    stars: r,
    count: ratingsList.filter((x) => x.rating === r).length,
    percentage: ratingsList.length > 0
      ? Math.round((ratingsList.filter((x) => x.rating === r).length / ratingsList.length) * 100)
      : 0,
  }))

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = profile?.name?.split(' ')[0] || 'there'

  return (
    <div className="space-y-8">
      {/* Header section with Greeting and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {greeting}, {firstName}
            </h1>
            <span className="text-2xl">👋</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Here&apos;s an overview of your customer feedback and QR activity for <strong className="text-foreground">{business.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/qr"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 text-white text-xs sm:text-sm font-semibold hover:bg-zinc-800 transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create QR</span>
          </Link>
          <Link
            href="/dashboard/feedback"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card text-foreground text-xs sm:text-sm font-medium hover:bg-muted transition-colors shadow-2xs"
          >
            <span>Feedback</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Scans"
          value={totalScans.toLocaleString()}
          icon={QrCode}
          sub="Customer QR scans recorded"
        />
        <StatCard
          label="Feedback Received"
          value={totalFeedback.toLocaleString()}
          icon={MessageSquare}
          sub="Total direct responses"
        />
        <StatCard
          label="Average Rating"
          value={avgRating !== '—' ? `${avgRating} ★` : '—'}
          icon={Star}
          badge={avgRating !== '—' && parseFloat(avgRating) >= 4.5 ? 'Excellent' : undefined}
          badgeVariant="success"
          sub={totalFeedback > 0 ? `Based on ${totalFeedback} reviews` : 'Awaiting first review'}
        />
        <StatCard
          label="Google Clicks"
          value={googleClicks.toLocaleString()}
          icon={ExternalLink}
          sub="Happy customers routed"
        />
      </div>

      {/* Unresolved Feedback Alert Banner */}
      {unresolved > 0 && (
        <div className="bg-amber-50/80 border border-amber-200/80 dark:bg-amber-950/20 dark:border-amber-900/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                {unresolved} customer {unresolved === 1 ? 'review requires' : 'reviews require'} your attention
              </p>
              <p className="text-xs text-amber-700/90 dark:text-amber-400/80 mt-0.5">
                Responding promptly to negative or unresolved feedback prevents public 1-star reviews.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/feedback?filter=unresolved"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-900 dark:bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 transition-colors shrink-0 shadow-2xs"
          >
            <span>Review Issues</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Two Column Layout: Recent Feedback + Rating Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Recent Feedback */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/80 shadow-2xs overflow-hidden flex flex-col">
          <div className="px-6 py-4.5 border-b border-border/60 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Recent Customer Feedback</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Latest reviews collected through your QR codes</p>
            </div>
            <Link
              href="/dashboard/feedback"
              className="text-xs font-semibold text-foreground hover:text-muted-foreground transition-colors inline-flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentFeedback.length === 0 ? (
            <div className="py-12 px-6">
              <EmptyState
                icon={MessageSquare}
                title="No feedback collected yet"
                description="Share or display your QR codes at your location to begin collecting real customer reviews."
                actionLabel="Create a QR Code"
                actionHref="/dashboard/qr"
              />
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {recentFeedback.map((f) => {
                const qrRaw = f.qr_codes as unknown as { name?: string } | { name?: string }[] | null
                const qrName = Array.isArray(qrRaw) ? qrRaw[0]?.name : qrRaw?.name

                const ratingBadgeColor =
                  f.rating >= 4
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : f.rating === 3
                    ? 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400'
                    : 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400'

                return (
                  <div key={f.id} className="p-5 flex items-start gap-4 hover:bg-muted/30 transition-colors">
                    {/* Rating Pill */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${ratingBadgeColor}`}
                    >
                      {f.rating}★
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        {qrName && (
                          <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border/50">
                            {qrName}
                          </span>
                        )}
                        {f.category && (
                          <span className="text-[11px] font-medium text-zinc-600 bg-zinc-100 dark:text-zinc-300 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                            {f.category}
                          </span>
                        )}
                        {f.status === 'new' && f.rating <= 3 && (
                          <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/60 px-2 py-0.5 rounded-full">
                            Needs attention
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-foreground leading-relaxed">
                        {f.message ? `"${f.message}"` : <span className="italic text-muted-foreground">Rating submitted with no comment</span>}
                      </p>
                    </div>

                    <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                      {format(new Date(f.created_at), 'MMM d')}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column (1 span): Rating Breakdown & Pro Tip */}
        <div className="space-y-6">
          {/* Rating Breakdown Card */}
          <div className="bg-card rounded-2xl border border-border/80 p-5 shadow-2xs">
            <h3 className="text-sm font-semibold text-foreground mb-1">Rating Breakdown</h3>
            <p className="text-xs text-muted-foreground mb-4">Distribution across all customer reviews</p>

            {ratingsList.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No ratings recorded yet</p>
            ) : (
              <div className="space-y-2.5">
                {ratingDistribution.map(({ stars, count, percentage }) => (
                  <div key={stars} className="flex items-center gap-2.5 text-xs">
                    <span className="w-7 font-medium text-foreground">{stars} ★</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          stars >= 4 ? 'bg-emerald-500' : stars === 3 ? 'bg-amber-400' : 'bg-rose-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-muted-foreground">{count} ({percentage}%)</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Best Practice Card */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 text-white rounded-2xl p-5 shadow-sm border border-zinc-800">
            <div className="flex items-center gap-2 mb-2 text-zinc-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider">Review Tip</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Place QR codes directly on guest tables or receipts with a clear prompt:
              <strong className="text-white block mt-1">«How was everything today? Rate in 5 seconds»</strong>
            </p>
            <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-[11px] text-zinc-400">Boost feedback rate</span>
              <Link href="/dashboard/qr" className="text-xs font-semibold text-white hover:text-zinc-300 transition-colors inline-flex items-center gap-1">
                <span>View QR codes</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
