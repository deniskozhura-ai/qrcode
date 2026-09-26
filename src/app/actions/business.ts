'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30)
  const suffix = Math.random().toString(36).slice(2, 7)
  return `${base}-${suffix}`
}

export async function saveBusiness(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const id = (formData.get('id') as string) || null
  const name = formData.get('name') as string
  const google_review_url = (formData.get('google_review_url') as string) || null
  const brand_color = (formData.get('brand_color') as string) || '#18181b'
  const timezone = (formData.get('timezone') as string) || 'UTC'
  const address = (formData.get('address') as string) || null

  if (id) {
    // Update existing
    const updateData: Record<string, any> = {
      name,
      google_review_url,
      brand_color,
      timezone,
    }
    if (address !== null) {
      updateData.address = address
    }

    let { error } = await supabase
      .from('businesses')
      .update(updateData)
      .eq('id', id)
      .eq('owner_id', user.id)

    // Fallback if 'address' column does not exist in the database
    if (error && (error.message?.includes('address') || error.code === 'PGRST204')) {
      delete updateData.address
      const retry = await supabase
        .from('businesses')
        .update(updateData)
        .eq('id', id)
        .eq('owner_id', user.id)
      error = retry.error
    }

    if (error) {
      console.error('[saveBusiness] update error:', error)
      redirect('/dashboard/settings/business?error=update_failed')
    }
  } else {
    // Insert new — generate unique slug
    let slug = generateSlug(name)

    // Ensure slug uniqueness
    const { data: existing } = await supabase
      .from('businesses')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existing) {
      slug = generateSlug(name) // try again with different suffix
    }

    const insertData: Record<string, any> = {
      owner_id: user.id,
      name,
      slug,
      google_review_url,
      brand_color,
      timezone,
    }
    if (address) {
      insertData.address = address
    }

    let { data: newBiz, error } = await supabase
      .from('businesses')
      .insert([insertData])
      .select('id')
      .single()

    // Fallback if 'address' column does not exist in the database
    if (error && (error.message?.includes('address') || error.code === 'PGRST204')) {
      delete insertData.address
      const retry = await supabase
        .from('businesses')
        .insert([insertData])
        .select('id')
        .single()
      error = retry.error
      newBiz = retry.data
    }

    if (error) {
      console.error('[saveBusiness] insert error:', error)
      redirect('/dashboard/settings/business?error=create_failed')
    }

    // Auto-create default QR code for the new business
    if (newBiz?.id) {
      const qrSlug = Math.random().toString(36).slice(2, 10)
      await supabase.from('qr_codes').insert([{
        business_id: newBiz.id,
        name: 'Main / Counter',
        slug: qrSlug,
        active: true,
      }])
    }
  }

  revalidatePath('/dashboard/settings/business')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/qr')

  if (!id) {
    redirect('/dashboard/qr')
  }
}
