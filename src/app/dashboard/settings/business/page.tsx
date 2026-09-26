import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { saveBusiness } from '@/app/actions/business'

export default async function BusinessSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: businesses } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const business = businesses?.[0]

  const { error } = await searchParams

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">
          {business ? 'Business Settings' : 'Create Your Business'}
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          {business
            ? 'Manage your business details and Google Review link.'
            : 'Set up your business profile to start collecting feedback.'}
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          Something went wrong. Please try again.
        </div>
      )}

      <form action={saveBusiness} className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5">
        <input type="hidden" name="id" value={business?.id || ''} />

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1.5">
            Business Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text" name="name" id="name" required
            defaultValue={business?.name || ''}
            className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            placeholder="e.g. Joe's Coffee"
          />
        </div>

        <div>
          <label htmlFor="google_review_url" className="block text-sm font-medium text-zinc-700 mb-1.5">
            Google Review URL <span className="text-zinc-400 font-normal">(optional)</span>
          </label>
          <input
            type="url" name="google_review_url" id="google_review_url"
            defaultValue={business?.google_review_url || ''}
            className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            placeholder="https://g.page/r/..."
          />
          <p className="text-xs text-zinc-400 mt-1">Link customers will use to leave a Google review.</p>
        </div>

        <div>
          <label htmlFor="brand_color" className="block text-sm font-medium text-zinc-700 mb-1.5">
            Brand Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color" name="brand_color" id="brand_color"
              defaultValue={business?.brand_color || '#18181b'}
              className="h-10 w-14 rounded-lg border border-zinc-200 cursor-pointer p-0.5 bg-white"
            />
            <span className="text-sm text-zinc-500">Used on your public QR feedback page</span>
          </div>
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-zinc-700 mb-1.5">
            Address <span className="text-zinc-400 font-normal">(optional)</span>
          </label>
          <input
            type="text" name="address" id="address"
            defaultValue={business?.address || ''}
            className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            placeholder="123 Main St, City"
          />
        </div>

        <div className="pt-2 border-t border-zinc-100">
          <button
            type="submit"
            className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-lg hover:bg-zinc-700 transition-colors"
          >
            {business ? 'Save Changes' : 'Create Business'}
          </button>
        </div>
      </form>

      {business && (
        <p className="text-xs text-zinc-400 mt-4">
          Business URL slug: <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600">{business.slug}</code>
        </p>
      )}
    </div>
  )
}
