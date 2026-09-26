'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Store, User, CreditCard } from 'lucide-react'

const tabs = [
  { href: '/dashboard/settings/business', label: 'Business Profile', icon: Store },
  { href: '/dashboard/settings/account', label: 'Account', icon: User },
  { href: '/dashboard/settings/billing', label: 'Plan & Billing', icon: CreditCard },
]

export default function SettingsNav() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1.5 border-b border-border/80 pb-2 mb-6 overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = pathname === tab.href

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              isActive
                ? 'bg-zinc-900 text-white font-semibold shadow-2xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
