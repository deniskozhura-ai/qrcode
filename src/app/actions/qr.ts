'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createQr(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const business_id = formData.get('business_id') as string
  const name = formData.get('name') as string
  const slug = Math.random().toString(36).substring(2, 10) // generate random slug

  const { error } = await supabase
    .from('qr_codes')
    .insert([{ business_id, name, slug }])

  if (error) {
    console.error(error)
    throw new Error('Failed to create QR code')
  }

  revalidatePath('/dashboard/qr')
}

export async function deleteQr(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  
  // RLS will ensure they can only delete their own
  const { error } = await supabase
    .from('qr_codes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error(error)
    throw new Error('Failed to delete QR code')
  }

  revalidatePath('/dashboard/qr')
}
