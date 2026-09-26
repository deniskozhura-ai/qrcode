import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { updateAccount } from '@/app/actions/account'

export default async function AccountSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Account Settings</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your personal account details.</p>
      </div>

      <form action={updateAccount} className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1.5">Full Name</label>
          <input
            id="name" name="name" type="text" defaultValue={profile?.name ?? ''}
            className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email</label>
          <input
            type="email" value={user.email ?? ''} disabled
            className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg bg-zinc-50 text-zinc-500 cursor-not-allowed"
          />
          <p className="text-xs text-zinc-400 mt-1">Email cannot be changed here.</p>
        </div>

        <div className="pt-2 border-t border-zinc-100">
          <button
            type="submit"
            className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </form>

      <div className="mt-6 bg-white rounded-2xl border border-red-200 p-6">
        <h3 className="font-semibold text-red-700 mb-1">Danger Zone</h3>
        <p className="text-sm text-zinc-500 mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
        <a
          href="mailto:support@reviewflow.app?subject=Delete my account"
          className="px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors inline-block"
        >
          Request Account Deletion
        </a>
      </div>
    </div>
  )
}
