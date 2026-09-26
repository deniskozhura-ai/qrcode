'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'
import { z } from 'zod'
import { CreateQrInputSchema } from '@/lib/validations'

function generateQrSlug(): string {
  return crypto.randomBytes(4).toString('hex')
}

export async function createQr(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const rawBusinessId = formData.get('business_id') as string
  const rawName = formData.get('name') as string

  const parsed = CreateQrInputSchema.safeParse({
    name: rawName,
    business_id: rawBusinessId,
  })

  if (!parsed.success) {
    throw new Error(`Invalid input: ${parsed.error.errors[0]?.message}`)
  }

  const { name, business_id } = parsed.data

  // Explicit ownership check: user must own the business
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', business_id)
    .eq('owner_id', user.id)
    .maybeSingle()

  if (bizError || !business) {
    throw new Error('Business not found or unauthorized')
  }

  // Generate unique slug with retries
  let slug = generateQrSlug()
  let attempts = 0
  while (attempts < 5) {
    const { data: existing } = await supabase
      .from('qr_codes')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!existing) break
    slug = generateQrSlug()
    attempts++
  }

  const { error } = await supabase
    .from('qr_codes')
    .insert([{ business_id, name, slug, active: true }])

  if (error) {
    console.error('[createQr] Insert error:', error)
    throw new Error('Failed to create QR code')
  }

  revalidatePath('/dashboard/qr')
}

export async function deleteQr(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const id = formData.get('id') as string

  // Validate UUID
  if (!z.string().uuid().safeParse(id).success) {
    throw new Error('Invalid QR code ID')
  }

  // Explicit ownership check before deletion: QR code must belong to a business owned by user
  const { data: qrItem, error: qrErr } = await supabase
    .from('qr_codes')
    .select('id, business_id, businesses!inner(owner_id)')
    .eq('id', id)
    .maybeSingle()

  if (qrErr || !qrItem) {
    throw new Error('QR code not found or unauthorized')
  }

  const { error } = await supabase
    .from('qr_codes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[deleteQr] Delete error:', error)
    throw new Error('Failed to delete QR code')
  }

  revalidatePath('/dashboard/qr')
}
