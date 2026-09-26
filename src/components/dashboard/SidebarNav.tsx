'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MessageSquare,
  QrCode,
  BarChart3,
  CreditCard,
  Settings,
  LogOut,
  Store,
} from 'lucide-react'
import { logout } from '@/app/actions/auth'

interface Props {
  user: {
    email?: string
    name?: string
  }
  business?: {
    id: string
    name: string
  }
  hasSubscription: boolean
  subscriptionStatus?: string | null
}

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/feedback', label: 'Feedback', icon: MessageSquare },
  { href: '/dashboard/qr', label: 'QR Codes', icon: QrCode },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/settings/business', label: 'Settings', icon: Settings },
]

export default function SidebarNav({ user, business, hasSubscription, subscriptionStatus }: Props) {
  const pathname = usePathname()

  const tierLabel = hasSubscription
    ? subscriptionStatus === 'trialing'
      ? 'Trial'
      : 'Pro'
    : 'Inactive'

  const tierColor = hasSubscription
    ? subscriptionStatus === 'trialing'
      ? 'bg-blue-50 text-blue-700 border-blue-200/60'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
    : 'bg-amber-50 text-amber-700 border-amber-200/60'

  return (
    <aside className="hidden md:flex w-64 border-r border-border bg-card/60 backdrop-blur-md flex-col shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-1 ring-zinc-800 transition-transform group-hover:scale-105">
            RF
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-foreground">ReviewFlow</span>
            <span className="text-[10px] text-muted-foreground -mt-0.5">Reputation SaaS</span>
          </div>
        </Link>
        <Link href="/dashboard/billing">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tierColor} transition-colors hover:opacity-85`}>
            {tierLabel}
          </span>
        </Link>
      </div>

      {/* Business Switcher / Current Store */}
      {business && (
        <div className="px-3.5 py-3 border-b border-border/40">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/50 border border-border/50 text-xs">
            <div className="w-6 h-6 rounded-md bg-background border border-border flex items-center justify-center text-muted-foreground shrink-0 shadow-2xs">
              <Store className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Active Location</p>
              <p className="font-semibold text-foreground truncate text-xs">{business.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 group ${
                isActive
                  ? 'bg-zinc-900 text-white font-semibold shadow-xs'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                }`}
              />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Account & Logout Footer */}
      <div className="px-3 py-3 border-t border-border/60 bg-muted/20">
        <div className="flex items-center gap-2.5 px-2.5 py-2 mb-1.5 rounded-lg hover:bg-muted/40 transition-colors">
          <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-semibold shrink-0 shadow-2xs">
            {(user.name || user.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">{user.name || 'Owner'}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
