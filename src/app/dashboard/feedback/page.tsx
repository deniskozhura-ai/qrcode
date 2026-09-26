import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  MessageSquare,
  CheckCircle2,
  Trash2,
  Star,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
} from 'lucide-react'
import { markFeedbackResolved, deleteFeedback } from '@/app/actions/dashboardFeedback'
import { getUserSubscription } from '@/lib/billing/server'
import { isSubscriptionActive } from '@/lib/billing/access'
import PageHeader from '@/components/dashboard/PageHeader'
import EmptyState from '@/components/dashboard/EmptyState'

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; page?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sub = await getUserSubscription()
  if (!isSubscriptionActive(sub)) {
    redirect('/dashboard/billing?notice=subscription_required')
  }

  const { data: businesses } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const business = businesses?.[0]
  if (!business) redirect('/dashboard/settings/business')

  const params = await searchParams
  const filter = params.filter ?? 'all'
  const page = Math.max(1, parseInt(params.page ?? '1'))
  const pageSize = 20
  const offset = (page - 1) * pageSize

  let query = supabase
    .from('feedback')
    .select('*, qr_codes(name)', { count: 'exact' })
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  if (filter === 'unresolved') {
    query = query.eq('status', 'new')
  } else if (filter === 'resolved') {
    query = query.eq('status', 'resolved')
  } else if (['1', '2', '3', '4', '5'].includes(filter)) {
    query = query.eq('rating', parseInt(filter))
  }

  const { data: feedbackItems, count } = await query.range(offset, offset + pageSize - 1)
  const totalPages = Math.ceil((count ?? 0) / pageSize)

  const filters = [
    { key: 'all', label: 'All Reviews' },
    { key: 'unresolved', label: 'Needs Attention' },
    { key: 'resolved', label: 'Resolved' },
    { key: '5', label: '5 ★' },
    { key: '4', label: '4 ★' },
    { key: '3', label: '3 ★' },
    { key: '2', label: '2 ★' },
    { key: '1', label: '1 ★' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Feedback"
        description="Monitor what customers say, resolve issues before they escalate, and view feedback by location."
        badge={
          count !== null ? (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
              {count} {count === 1 ? 'review' : 'reviews'}
            </span>
          ) : undefined
        }
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        {filters.map((f) => {
          const isActive = filter === f.key
          return (
            <Link
              key={f.key}
              href={`/dashboard/feedback?filter=${f.key}`}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150 ${
                isActive
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs font-semibold'
                  : 'bg-card text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      {/* Feedback Feed / List */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-2xs overflow-hidden">
        {!feedbackItems || feedbackItems.length === 0 ? (
          <div className="py-14 px-6">
            <EmptyState
              icon={MessageSquare}
              title="No feedback matching this filter"
              description="No customer reviews found for the selected view. Try selecting another filter or wait for new responses."
              actionLabel="Show All Feedback"
              actionHref="/dashboard/feedback?filter=all"
            />
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {feedbackItems.map((item) => {
              const qrName =
                item.qr_codes && !Array.isArray(item.qr_codes)
                  ? item.qr_codes.name
                  : Array.isArray(item.qr_codes) && item.qr_codes[0]
                  ? item.qr_codes[0].name
                  : 'Direct'

              const ratingBadgeStyle =
                item.rating >= 4
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : item.rating === 3
                  ? 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400'
                  : 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400'

              return (
                <div key={item.id} className="p-5 sm:p-6 hover:bg-muted/20 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                    {/* Star Rating & Pills */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${ratingBadgeStyle}`}>
                        <span>{item.rating}</span>
                        <Star className="w-3 h-3 fill-current" />
                      </div>

                      {item.status === 'resolved' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Resolved
                        </span>
                      ) : item.rating <= 3 ? (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
                          Needs attention
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full">
                          New
                        </span>
                      )}

                      {item.category && (
                        <span className="text-[11px] font-medium text-zinc-600 bg-zinc-100 dark:text-zinc-300 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                          {item.category}
                        </span>
                      )}
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 bg-muted/60 px-2 py-1 rounded-md border border-border/50">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="font-medium text-foreground">{qrName}</span>
                      </div>

                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{format(new Date(item.created_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Message body */}
                  <div className="my-3">
                    {item.message ? (
                      <p className="text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-wrap">
                        &ldquo;{item.message}&rdquo;
                      </p>
                    ) : (
                      <p className="text-sm italic text-muted-foreground">
                        Customer submitted a {item.rating}-star rating with no text comment.
                      </p>
                    )}
                  </div>

                  {/* Action buttons footer */}
                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-end gap-2.5">
                    {item.status !== 'resolved' && (
                      <form action={markFeedbackResolved}>
                        <input type="hidden" name="id" value={item.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold border border-emerald-200/60 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Resolved</span>
                        </button>
                      </form>
                    )}

                    <form action={deleteFeedback}>
                      <input type="hidden" name="id" value={item.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-border/60 bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Showing page <strong className="text-foreground">{page}</strong> of <strong className="text-foreground">{totalPages}</strong> ({count} total items)
            </p>
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <Link
                  href={`/dashboard/feedback?filter=${filter}&page=${page - 1}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-border bg-card rounded-lg hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-border/40 text-muted-foreground/40 rounded-lg cursor-not-allowed">
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </span>
              )}

              {page < totalPages ? (
                <Link
                  href={`/dashboard/feedback?filter=${filter}&page=${page + 1}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-border bg-card rounded-lg hover:bg-muted transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-border/40 text-muted-foreground/40 rounded-lg cursor-not-allowed">
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
