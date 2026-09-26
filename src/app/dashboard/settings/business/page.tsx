import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { saveBusiness } from '@/app/actions/business'
import PageHeader from '@/components/dashboard/PageHeader'
import SettingsNav from '@/components/dashboard/SettingsNav'
import { AlertCircle, Check } from 'lucide-react'

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
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title={business ? 'Business Settings' : 'Create Your Business'}
        description="Configure your location name, Google Reviews destination, and brand accent colors."
      />

      <SettingsNav />

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Something went wrong while saving your business. Please verify the input and try again.</span>
        </div>
      )}

      <form action={saveBusiness} className="bg-card rounded-2xl border border-border/80 p-6 sm:p-7 shadow-2xs space-y-5">
        <input type="hidden" name="id" value={business?.id || ''} />

        <div>
          <label htmlFor="name" className="block text-xs font-semibold text-foreground mb-1.5">
            Business Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            name="name"
            id="name"
            required
            defaultValue={business?.name || ''}
            className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-colors"
            placeholder="e.g. Apex Bistro & Lounge"
          />
        </div>

        <div>
          <label htmlFor="google_review_url" className="block text-xs font-semibold text-foreground mb-1.5">
            Google Review Direct Link <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            type="url"
            name="google_review_url"
            id="google_review_url"
            defaultValue={business?.google_review_url || ''}
            className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-colors"
            placeholder="https://g.page/r/your-google-place-id/review"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Happy customers (4–5 stars) will be invited to post their review directly via this link.
          </p>
        </div>

        <div>
          <label htmlFor="brand_color" className="block text-xs font-semibold text-foreground mb-1.5">
            Brand Accent Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              name="brand_color"
              id="brand_color"
              defaultValue={business?.brand_color || '#18181b'}
              className="h-10 w-14 rounded-xl border border-border cursor-pointer p-0.5 bg-card"
            />
            <span className="text-xs text-muted-foreground">
              Applied to top accents and interactive star highlights on customer feedback cards.
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="address" className="block text-xs font-semibold text-foreground mb-1.5">
            Physical Address <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            type="text"
            name="address"
            id="address"
            defaultValue={business?.address || ''}
            className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-colors"
            placeholder="123 Main Street, Suite 400"
          />
        </div>

        <div className="pt-4 border-t border-border/60 flex items-center justify-between">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition-all shadow-xs"
          >
            <Check className="w-4 h-4" />
            <span>{business ? 'Save Changes' : 'Create Business Profile'}</span>
          </button>

          {business && (
            <span className="text-xs text-muted-foreground">
              Slug: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">{business.slug}</code>
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
