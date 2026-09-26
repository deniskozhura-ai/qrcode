import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/dashboard/PageHeader'
import SettingsNav from '@/components/dashboard/SettingsNav'
import { CreditCard, Check, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'

export default async function BillingSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const isActive = subscription?.status === 'active'
  const isTrial = subscription?.status === 'trialing'

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Plan & Billing"
        description="Overview of your current ReviewFlow subscription tier, usage entitlements, and invoice history."
      />

      <SettingsNav />

      {/* Subscription Card */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-2xs overflow-hidden">
        <div className="p-6 sm:p-7 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-zinc-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-semibold text-foreground text-base">ReviewFlow Pro</h3>
                {isActive ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                ) : isTrial ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Trial Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-500/10 text-muted-foreground border border-border">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                    Free Trial
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Full access to all QR generator, filtering, and analytics features.
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-2xl font-bold tracking-tight text-foreground">299 грн</div>
            <div className="text-xs text-muted-foreground">billed monthly</div>
          </div>
        </div>

        <div className="p-6 sm:p-7 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-foreground/90">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Unlimited QR codes & locations</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Real-time sentiment categorization</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Google Review auto-routing (4–5★)</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Export analytics & print-ready QRs</span>
            </div>
          </div>

          <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Encrypted billing powered by Lemon Squeezy</span>
            </div>

            <Link
              href="/dashboard/billing"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-all shadow-xs"
            >
              <CreditCard className="w-4 h-4" />
              <span>Manage Subscription & Invoices</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
