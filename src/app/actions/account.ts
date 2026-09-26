'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const AccountUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty').max(100, 'Name too long'),
})

export async function updateAccount(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const rawName = formData.get('name') as string
  const parsed = AccountUpdateSchema.safeParse({ name: rawName })
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message || 'Invalid name')
  }

  const { error } = await supabase
    .from('profiles')
    .update({ name: parsed.data.name })
    .eq('id', user.id)

  if (error) {
    console.error('[updateAccount] Update error:', error)
    throw new Error('Failed to update account')
  }

  revalidatePath('/dashboard/settings/account')
  revalidatePath('/dashboard')
}
