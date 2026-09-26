'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import crypto from 'crypto'
import { z } from 'zod'
import { BusinessInputSchema } from '@/lib/validations'

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30) || 'biz'
  const suffix = crypto.randomBytes(3).toString('hex')
  return `${base}-${suffix}`
}

function generateQrSlug(): string {
  return crypto.randomBytes(4).toString('hex')
}

export async function saveBusiness(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const id = (formData.get('id') as string) || null

  // 1. Validate Input
  const rawData = {
    name: formData.get('name') as string,
    google_review_url: (formData.get('google_review_url') as string) || null,
    brand_color: (formData.get('brand_color') as string) || '#18181b',
    timezone: (formData.get('timezone') as string) || 'UTC',
    address: (formData.get('address') as string) || null,
  }

  const parsed = BusinessInputSchema.safeParse(rawData)
  if (!parsed.success) {
    const errorMsg = parsed.error.errors[0]?.message || 'Invalid business data'
    redirect(`/dashboard/settings/business?error=${encodeURIComponent(errorMsg)}`)
  }

  const { name, google_review_url, brand_color, timezone, address } = parsed.data

  if (id) {
    // Validate UUID format of id
    if (!z.string().uuid().safeParse(id).success) {
      redirect('/dashboard/settings/business?error=Invalid+business+ID')
    }

    // Explicit ownership check
    const { data: existingBiz } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', id)
      .eq('owner_id', user.id)
      .maybeSingle()

    if (!existingBiz) {
      redirect('/dashboard/settings/business?error=Business+not+found+or+unauthorized')
    }

    // Update existing
    const updateData: Record<string, unknown> = {
      name,
      google_review_url: google_review_url || null,
      brand_color,
      timezone,
    }
    if (address !== null && address !== undefined) {
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
      redirect('/dashboard/settings/business?error=Failed+to+update+business')
    }
  } else {
    // Insert new — ensure slug uniqueness with retries
    let slug = generateSlug(name)
    let attempts = 0
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

      if (!existing) break
      slug = generateSlug(name)
      attempts++
    }

    const insertData: Record<string, unknown> = {
      owner_id: user.id,
      name,
      slug,
      google_review_url: google_review_url || null,
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
      redirect('/dashboard/settings/business?error=Failed+to+create+business')
    }

    // Auto-create default QR code for the new business
    if (newBiz?.id) {
      const qrSlug = generateQrSlug()
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
