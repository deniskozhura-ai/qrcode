'use client'

import { useState } from 'react'
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
  Menu,
  X,
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

export default function MobileNav({ user, business, hasSubscription, subscriptionStatus }: Props) {
  const [isOpen, setIsOpen] = useState(false)
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
    <div className="md:hidden sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            RF
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">ReviewFlow</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tierColor}`}>
            {tierLabel}
          </span>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop and Menu */}
      {isOpen && (
        <div className="fixed inset-0 top-[49px] z-50 bg-black/40 backdrop-blur-xs flex flex-col">
          <div className="bg-card border-b border-border p-4 shadow-xl flex-1 flex flex-col max-h-[85vh] overflow-y-auto">
            {business && (
              <div className="mb-4 flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/60 border border-border/60">
                <Store className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase">Active Location</p>
                  <p className="text-xs font-semibold text-foreground truncate">{business.name}</p>
                </div>
              </div>
            )}

            <nav className="space-y-1 flex-1">
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
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-zinc-900 text-white font-semibold'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{user.name || 'Owner'}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>

              <form action={logout}>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </button>
              </form>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  )
}
