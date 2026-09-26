'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateAccount(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const name = formData.get('name') as string

  await supabase.from('profiles').update({ name }).eq('id', user.id)
  revalidatePath('/dashboard/settings/account')
  revalidatePath('/dashboard')
}
