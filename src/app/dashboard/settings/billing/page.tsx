import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function BillingSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // In MVP, we have a fixed pricing model.
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Billing</h1>
        <p className="text-zinc-500 mt-1">Manage your subscription and payment methods.</p>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-50">
          <h3 className="font-semibold text-zinc-900">Current Plan</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-lg font-bold text-zinc-900">ReviewFlow Pro</p>
              <p className="text-sm text-zinc-500 mt-1">299 грн / month</p>
            </div>
            <div>
              {subscription?.status === 'active' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              ) : subscription?.status === 'trialing' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Trial Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800">
                  Free Trial / Inactive
                </span>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-200">
            <p className="text-sm text-zinc-600 mb-4">
              Everything included. Unlimited locations and QR codes.
            </p>
            
            <form action="/api/stripe/create-portal-session" method="POST">
              <button
                type="submit"
                className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
              >
                Manage Subscription
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
