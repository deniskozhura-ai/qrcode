'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'
import { z } from 'zod'
import { CreateQrInputSchema } from '@/lib/validations'
import { getUserSubscription } from '@/lib/billing/server'
import { isSubscriptionActive } from '@/lib/billing/access'
import { logger } from '@/lib/logger'

// ─── Tier-based QR limits ────────────────────────────────────────────────────
const QR_LIMIT_TRIAL = 3  // trialing users: max 3 QR codes per business
const QR_LIMIT_PRO = Infinity // active/paid: unlimited

function generateQrSlug(): string {
  return crypto.randomBytes(4).toString('hex')
}

export async function createQr(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // 1. Server-side subscription check — cannot be bypassed from client
  const sub = await getUserSubscription()
  if (!isSubscriptionActive(sub)) {
    throw new Error('Active subscription or trial required to create QR codes')
  }

  // 2. Validate input
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

  // 3. Explicit ownership check: user must own the business
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', business_id)
    .eq('owner_id', user.id)
    .maybeSingle()

  if (bizError || !business) {
    throw new Error('Business not found or unauthorized')
  }

  // 4. Enforce QR code limits per subscription tier
  const isProUser = sub?.status === 'active' || sub?.status === 'past_due'
  const qrLimit = isProUser ? QR_LIMIT_PRO : QR_LIMIT_TRIAL

  if (qrLimit !== Infinity) {
    const { count, error: countError } = await supabase
      .from('qr_codes')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', business_id)

    if (countError) {
      logger.error('qr.count_failed', { businessId: business_id, error: countError.message })
      throw new Error('Failed to validate QR code limits')
    }

    if ((count ?? 0) >= qrLimit) {
      throw new Error(
        `Your current plan allows up to ${qrLimit} QR code${qrLimit === 1 ? '' : 's'}. ` +
        `Upgrade to Pro for unlimited QR codes.`
      )
    }
  }

  // 5. Generate unique slug with retries
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

  // 6. Insert
  const { error } = await supabase
    .from('qr_codes')
    .insert([{ business_id, name, slug, active: true }])

  if (error) {
    logger.error('qr.create_failed', { businessId: business_id, error: error.message })
    throw new Error('Failed to create QR code')
  }

  logger.info('qr.created', { userId: user.id, businessId: business_id })
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

  // Explicit ownership check before deletion
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
    logger.error('qr.delete_failed', { qrId: id, error: error.message })
    throw new Error('Failed to delete QR code')
  }

  logger.info('qr.deleted', { userId: user.id, qrId: id })
  revalidatePath('/dashboard/qr')
}
