'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function submitFeedback(formData: FormData) {
  const supabase = await createClient()
  
  const business_id = formData.get('business_id') as string
  const qr_code_id = formData.get('qr_code_id') as string
  const rating = parseInt(formData.get('rating') as string)
  const category = formData.get('category') as string || null
  const message = formData.get('message') as string || null

  const { error } = await supabase
    .from('feedback')
    .insert([{
      business_id,
      qr_code_id,
      rating,
      category,
      message,
      status: 'new'
    }])

  if (error) {
    console.error(error)
    throw new Error('Failed to submit feedback')
  }

  // Also record analytics
  await supabase.from('analytics_events').insert([{
    business_id,
    qr_code_id,
    event_type: 'feedback_submitted',
    metadata: { rating, category }
  }])

  // In real app, trigger resend email here for low ratings

  redirect(`/q/success?business_id=${business_id}&rating=${rating}`)
}

export async function trackGoogleClick(business_id: string, qr_code_id: string) {
  const supabase = await createClient()
  
  await supabase.from('analytics_events').insert([{
    business_id,
    qr_code_id,
    event_type: 'google_review_clicked'
  }])
}

export async function trackScan(business_id: string, qr_code_id: string) {
  const supabase = await createClient()
  
  await supabase.from('analytics_events').insert([{
    business_id,
    qr_code_id,
    event_type: 'qr_scan'
  }])
}
