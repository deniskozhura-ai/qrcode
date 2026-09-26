import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { updateAccount } from '@/app/actions/account'
import PageHeader from '@/components/dashboard/PageHeader'
import SettingsNav from '@/components/dashboard/SettingsNav'
import { User, Mail, Check, AlertTriangle, Shield } from 'lucide-react'

export default async function AccountSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Account Settings"
        description="Manage your personal profile details, authentication credentials, and privacy options."
      />

      <SettingsNav />

      {/* Profile Form */}
      <form action={updateAccount} className="bg-card rounded-2xl border border-border/80 p-6 sm:p-7 shadow-2xs space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-border/60">
          <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-foreground font-semibold text-sm">
            {(profile?.name || user.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{profile?.name || 'Account Owner'}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </div>
        </div>

        <div>
          <label htmlFor="name" className="block text-xs font-semibold text-foreground mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={profile?.name ?? ''}
              placeholder="e.g. Denis Kozhura"
              className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-colors"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-foreground mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="email"
              type="email"
              value={user.email ?? ''}
              disabled
              className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-border/60 rounded-xl bg-muted/40 text-muted-foreground cursor-not-allowed select-none"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Email is linked directly to your authentication identity.</span>
          </p>
        </div>

        <div className="pt-4 border-t border-border/60 flex items-center justify-between">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition-all shadow-xs"
          >
            <Check className="w-4 h-4" />
            <span>Save Profile</span>
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="bg-card rounded-2xl border border-destructive/20 p-6 sm:p-7 shadow-2xs space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-destructive/10 text-destructive shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Danger Zone</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Permanently delete your account, businesses, QR codes, and customer feedback history. This action cannot be reversed.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-border/40 flex justify-end">
          <a
            href="mailto:support@reviewflow.app?subject=Delete my account"
            className="inline-flex items-center gap-2 px-4 py-2 border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-semibold rounded-xl transition-colors"
          >
            <span>Request Account Deletion</span>
          </a>
        </div>
      </div>
    </div>
  )
}
