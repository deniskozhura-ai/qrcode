'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markFeedbackResolved(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string

  const { error } = await supabase
    .from('feedback')
    .update({ status: 'resolved' })
    .eq('id', id)

  if (error) {
    console.error(error)
    throw new Error('Failed to resolve feedback')
  }

  revalidatePath('/dashboard/feedback')
}

export async function deleteFeedback(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string

  const { error } = await supabase
    .from('feedback')
    .delete()
    .eq('id', id)

  if (error) {
    console.error(error)
    throw new Error('Failed to delete feedback')
  }

  revalidatePath('/dashboard/feedback')
}
