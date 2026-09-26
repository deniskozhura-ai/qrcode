import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import { getUserSubscription } from '@/lib/billing/server'
import { isSubscriptionActive } from '@/lib/billing/access'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/dashboard/feedback', label: 'Feedback', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
  { href: '/dashboard/qr', label: 'QR Codes', icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { href: '/dashboard/settings/business', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { href: '/dashboard/billing', label: 'Billing', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email')
    .eq('id', user.id)
    .single()

  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('owner_id', user.id)
    .order('created_at')

  const currentBusiness = businesses?.[0]
  const sub = await getUserSubscription()
  const hasSubscription = isSubscriptionActive(sub)

  return (
    <div className="flex h-screen bg-zinc-50 font-sans antialiased">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-zinc-200 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-zinc-100 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white text-xs font-bold">RF</span>
            <span className="text-sm font-semibold text-zinc-900">ReviewFlow</span>
          </Link>
          <Link href="/dashboard/billing">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              hasSubscription ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {hasSubscription ? (sub?.status === 'trialing' ? 'Trial' : 'Pro') : 'Inactive'}
            </span>
          </Link>
        </div>

        {/* Business switcher */}
        {currentBusiness && (
          <div className="px-3 py-3 border-b border-zinc-100">
            <div className="px-2 py-2 rounded-lg bg-zinc-50 border border-zinc-200">
              <p className="text-xs text-zinc-400 font-medium mb-0.5">Business</p>
              <p className="text-sm font-semibold text-zinc-900 truncate">{currentBusiness.name}</p>
            </div>
          </div>
        )}

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-2.5 py-2 text-sm font-medium rounded-lg text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors group"
            >
              <svg className="w-4.5 h-4.5 text-zinc-400 group-hover:text-zinc-600 shrink-0" width={18} height={18} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                {item.icon.split(' M').map((d, i) => (
                  <path key={i} strokeLinecap="round" strokeLinejoin="round" d={i === 0 ? d : 'M' + d} />
                ))}
              </svg>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-zinc-100">
          <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-semibold text-zinc-600 shrink-0">
              {(profile?.name || user.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-900 truncate">{profile?.name || 'User'}</p>
              <p className="text-xs text-zinc-400 truncate">{user.email}</p>
            </div>
          </div>
          <form action={logout}>
            <button type="submit" className="w-full flex items-center gap-2.5 px-2.5 py-2 text-sm font-medium rounded-lg text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Log out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  )
}
