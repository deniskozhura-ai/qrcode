import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { markFeedbackResolved, deleteFeedback } from '@/app/actions/dashboardFeedback'

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; page?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: businesses } = await supabase.from('businesses').select('id').eq('owner_id', user.id).order('created_at', { ascending: false }).limit(1)
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
  } else if (['1','2','3','4','5'].includes(filter)) {
    query = query.eq('rating', parseInt(filter))
  }

  const { data: feedbackItems, count } = await query.range(offset, offset + pageSize - 1)
  const totalPages = Math.ceil((count ?? 0) / pageSize)

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'unresolved', label: '🔴 Unresolved' },
    { key: 'resolved', label: '✅ Resolved' },
    { key: '5', label: '★ 5' },
    { key: '4', label: '★ 4' },
    { key: '3', label: '★ 3' },
    { key: '2', label: '★ 2' },
    { key: '1', label: '★ 1' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Feedback</h1>
        <p className="text-zinc-500 text-sm mt-1">Review and resolve what your customers are saying.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map(f => (
          <a
            key={f.key}
            href={`/dashboard/feedback?filter=${f.key}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === f.key
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        {!feedbackItems || feedbackItems.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-zinc-400 font-medium">No feedback found</p>
            <p className="text-zinc-400 text-sm mt-1">Try changing the filter or wait for new responses.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 text-xs uppercase tracking-wide">Rating</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 text-xs uppercase tracking-wide">Category</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 text-xs uppercase tracking-wide">Message</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 text-xs uppercase tracking-wide">QR</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 text-xs uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 text-xs uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {feedbackItems.map((item) => {
                  const qrName = item.qr_codes && !Array.isArray(item.qr_codes)
                    ? item.qr_codes.name
                    : Array.isArray(item.qr_codes) && item.qr_codes[0]
                    ? item.qr_codes[0].name
                    : '—'
                  return (
                    <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                          item.rating >= 4 ? 'bg-green-100 text-green-700' 
                          : item.rating === 3 ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                        }`}>
                          {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {item.category ? (
                          <span className="bg-zinc-100 px-2 py-0.5 rounded text-xs">{item.category}</span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-zinc-700 max-w-xs">
                        <p className="truncate">{item.message || '(no message)'}</p>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">{qrName}</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                        {format(new Date(item.created_at), 'dd MMM yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        {item.status === 'resolved' ? (
                          <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Resolved</span>
                        ) : (
                          <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">New</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          {item.status !== 'resolved' && (
                            <form action={markFeedbackResolved}>
                              <input type="hidden" name="id" value={item.id} />
                              <button type="submit" className="text-xs font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap">
                                Resolve
                              </button>
                            </form>
                          )}
                          <form action={deleteFeedback}>
                            <input type="hidden" name="id" value={item.id} />
                            <button type="submit" className="text-xs font-medium text-red-500 hover:text-red-700">
                              Delete
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-zinc-100">
            <p className="text-xs text-zinc-400">Page {page} of {totalPages} · {count} total</p>
            <div className="flex gap-2">
              {page > 1 && (
                <a href={`/dashboard/feedback?filter=${filter}&page=${page - 1}`}
                  className="px-3 py-1.5 text-xs font-medium border border-zinc-200 rounded-lg hover:bg-zinc-50">
                  ← Previous
                </a>
              )}
              {page < totalPages && (
                <a href={`/dashboard/feedback?filter=${filter}&page=${page + 1}`}
                  className="px-3 py-1.5 text-xs font-medium border border-zinc-200 rounded-lg hover:bg-zinc-50">
                  Next →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
