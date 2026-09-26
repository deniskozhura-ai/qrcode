import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  BarChart3,
  QrCode,
  MessageSquare,
  Star,
  ExternalLink,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { getUserSubscription } from '@/lib/billing/server'
import { isSubscriptionActive } from '@/lib/billing/access'
import PageHeader from '@/components/dashboard/PageHeader'
import StatCard from '@/components/dashboard/StatCard'
import EmptyState from '@/components/dashboard/EmptyState'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sub = await getUserSubscription()
  if (!isSubscriptionActive(sub)) {
    redirect('/dashboard/billing?notice=subscription_required')
  }

  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const business = businesses?.[0]
  if (!business) redirect('/dashboard/settings/business')

  const bid = business.id

  const [feedbackRes, eventsRes, qrCodesRes] = await Promise.all([
    supabase.from('feedback').select('rating, category, created_at, status, qr_code_id').eq('business_id', bid).order('created_at'),
    supabase.from('analytics_events').select('event_type, created_at, qr_code_id').eq('business_id', bid),
    supabase.from('qr_codes').select('id, name').eq('business_id', bid),
  ])

  const feedback = feedbackRes.data ?? []
  const events = eventsRes.data ?? []
  const qrCodes = qrCodesRes.data ?? []

  // Rating distribution
  const totalFeedbackCount = feedback.length
  const ratingDist = [5, 4, 3, 2, 1].map((r) => {
    const count = feedback.filter((f) => f.rating === r).length
    const percentage = totalFeedbackCount > 0 ? Math.round((count / totalFeedbackCount) * 100) : 0
    return { rating: r, count, percentage }
  })
  const maxRatingCount = Math.max(...ratingDist.map((d) => d.count), 1)

  // Category breakdown (negative / feedback needing improvement)
  const categorizedFeedback = feedback.filter((f) => f.category)
  const catCounts: Record<string, number> = {}
  categorizedFeedback.forEach((f) => {
    catCounts[f.category!] = (catCounts[f.category!] ?? 0) + 1
  })
  const topCategories = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxCatCount = Math.max(...topCategories.map(([, c]) => c), 1)

  // Totals
  const totalScans = events.filter((e) => e.event_type === 'qr_scan').length
  const googleClicks = events.filter((e) => e.event_type === 'google_review_clicked').length
  const feedbackCopied = events.filter((e) => e.event_type === 'feedback_copied').length
  const avgRating = feedback.length > 0
    ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(2)
    : '—'

  // Conversion rate: feedback / scans
  const responseRate = totalScans > 0 ? Math.round((totalFeedbackCount / totalScans) * 100) : 0

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics & Insights"
        description="Comprehensive real-time overview of customer scans, reviews, and conversion to Google Reviews."
        badge={
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
            All-Time Activity
          </span>
        }
      />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total QR Scans"
          value={totalScans.toLocaleString()}
          icon={QrCode}
          sub="Customer visits recorded"
        />
        <StatCard
          label="Total Responses"
          value={totalFeedbackCount.toLocaleString()}
          icon={MessageSquare}
          badge={totalScans > 0 ? `${responseRate}% rate` : undefined}
          badgeVariant="info"
          sub="Scan-to-feedback conversion"
        />
        <StatCard
          label="Average Score"
          value={avgRating !== '—' ? `${avgRating} ★` : '—'}
          icon={Star}
          badge={avgRating !== '—' && parseFloat(avgRating) >= 4.5 ? 'Top Rated' : undefined}
          badgeVariant="success"
          sub={totalFeedbackCount > 0 ? `From ${totalFeedbackCount} ratings` : 'No reviews yet'}
        />
        <StatCard
          label="Google Clicks"
          value={googleClicks.toLocaleString()}
          icon={ExternalLink}
          sub={`${feedbackCopied} reviews copied`}
        />
      </div>

      {totalScans === 0 && totalFeedbackCount === 0 ? (
        <div className="bg-card rounded-2xl border border-border/80 py-16 px-6">
          <EmptyState
            icon={BarChart3}
            title="No analytics data yet"
            description="Once customers interact with your QR codes and leave feedback, your metrics and distributions will appear here."
            actionLabel="View QR Codes"
            actionHref="/dashboard/qr"
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Visualizations: 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rating Distribution Card */}
            <div className="bg-card rounded-2xl border border-border/80 p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Rating Distribution</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Sentiment breakdown from 1 to 5 stars</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground border border-border/60">
                  <Star className="w-4 h-4" />
                </div>
              </div>

              {totalFeedbackCount === 0 ? (
                <p className="text-xs text-muted-foreground py-8 text-center">No feedback ratings recorded yet.</p>
              ) : (
                <div className="space-y-3.5 mt-5">
                  {ratingDist.map(({ rating, count, percentage }) => (
                    <div key={rating} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground flex items-center gap-1">
                          <span>{rating}</span>
                          <Star className="w-3 h-3 fill-current text-amber-400" />
                        </span>
                        <span className="text-muted-foreground">
                          <strong className="text-foreground font-semibold">{count}</strong> ({percentage}%)
                        </span>
                      </div>

                      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            rating >= 4 ? 'bg-emerald-500' : rating === 3 ? 'bg-amber-400' : 'bg-rose-500'
                          }`}
                          style={{ width: `${(count / maxRatingCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Feedback Categories / Areas of Interest */}
            <div className="bg-card rounded-2xl border border-border/80 p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Reported Categories</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Primary themes selected by customers</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground border border-border/60">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>

              {topCategories.length === 0 ? (
                <p className="text-xs text-muted-foreground py-8 text-center">
                  No categorized feedback received yet.
                </p>
              ) : (
                <div className="space-y-3.5 mt-5">
                  {topCategories.map(([categoryName, count]) => {
                    const percentage = Math.round((count / categorizedFeedback.length) * 100)
                    return (
                      <div key={categoryName} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-foreground capitalize">
                            {categoryName.replace('_', ' ')}
                          </span>
                          <span className="text-muted-foreground">
                            <strong className="text-foreground font-semibold">{count}</strong> mentions ({percentage}%)
                          </span>
                        </div>

                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-700"
                            style={{ width: `${(count / maxCatCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* QR Locations Performance Table */}
          {qrCodes.length > 0 && (
            <div className="bg-card rounded-2xl border border-border/80 shadow-2xs overflow-hidden">
              <div className="px-6 py-4.5 border-b border-border/60 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Location & QR Performance</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Scan volume and review responses by QR code</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{qrCodes.length} Locations</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm text-left">
                  <thead className="bg-muted/40 border-b border-border/60 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-6">Location / QR Name</th>
                      <th className="py-3 px-6 text-center">Scans</th>
                      <th className="py-3 px-6 text-center">Responses</th>
                      <th className="py-3 px-6 text-center">Conversion</th>
                      <th className="py-3 px-6 text-right">Avg Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {qrCodes.map((qr) => {
                      const scans = events.filter((e) => e.qr_code_id === qr.id && e.event_type === 'qr_scan').length
                      const fb = feedback.filter((f) => f.qr_code_id === qr.id)
                      const conv = scans > 0 ? `${Math.round((fb.length / scans) * 100)}%` : '0%'
                      const qrAvg = fb.length > 0 ? (fb.reduce((s, x) => s + x.rating, 0) / fb.length).toFixed(1) : '—'

                      return (
                        <tr key={qr.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3.5 px-6 font-semibold text-foreground flex items-center gap-2">
                            <QrCode className="w-4 h-4 text-muted-foreground" />
                            <span>{qr.name}</span>
                          </td>
                          <td className="py-3.5 px-6 text-center text-foreground font-medium">{scans}</td>
                          <td className="py-3.5 px-6 text-center text-foreground font-medium">{fb.length}</td>
                          <td className="py-3.5 px-6 text-center text-muted-foreground font-medium">{conv}</td>
                          <td className="py-3.5 px-6 text-right font-bold text-foreground">
                            {qrAvg !== '—' ? (
                              <span className="inline-flex items-center gap-1">
                                {qrAvg} <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
