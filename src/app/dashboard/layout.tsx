import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserSubscription } from '@/lib/billing/server'
import { isSubscriptionActive } from '@/lib/billing/access'
import SidebarNav from '@/components/dashboard/SidebarNav'
import MobileNav from '@/components/dashboard/MobileNav'

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

  const userInfo = {
    email: user.email,
    name: profile?.name,
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row antialiased">
      {/* Mobile Navigation Header & Drawer */}
      <MobileNav
        user={userInfo}
        business={currentBusiness}
        hasSubscription={hasSubscription}
        subscriptionStatus={sub?.status}
      />

      {/* Desktop Sidebar */}
      <SidebarNav
        user={userInfo}
        business={currentBusiness}
        hasSubscription={hasSubscription}
        subscriptionStatus={sub?.status}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
