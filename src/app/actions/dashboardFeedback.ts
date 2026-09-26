'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export async function markFeedbackResolved(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const id = formData.get('id') as string

  // Validate UUID
  if (!z.string().uuid().safeParse(id).success) {
    throw new Error('Invalid feedback ID')
  }

  // Explicit ownership check
  const { data: item, error: findError } = await supabase
    .from('feedback')
    .select('id, business_id, businesses!inner(owner_id)')
    .eq('id', id)
    .maybeSingle()

  if (findError || !item) {
    throw new Error('Feedback item not found or unauthorized')
  }

  const { error } = await supabase
    .from('feedback')
    .update({ status: 'resolved' })
    .eq('id', id)

  if (error) {
    console.error('[markFeedbackResolved] Update error:', error)
    throw new Error('Failed to resolve feedback')
  }

  revalidatePath('/dashboard/feedback')
  revalidatePath('/dashboard')
}

export async function deleteFeedback(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const id = formData.get('id') as string

  // Validate UUID
  if (!z.string().uuid().safeParse(id).success) {
    throw new Error('Invalid feedback ID')
  }

  // Explicit ownership check
  const { data: item, error: findError } = await supabase
    .from('feedback')
    .select('id, business_id, businesses!inner(owner_id)')
    .eq('id', id)
    .maybeSingle()

  if (findError || !item) {
    throw new Error('Feedback item not found or unauthorized')
  }

  const { error } = await supabase
    .from('feedback')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[deleteFeedback] Delete error:', error)
    throw new Error('Failed to delete feedback')
  }

  revalidatePath('/dashboard/feedback')
  revalidatePath('/dashboard')
}
