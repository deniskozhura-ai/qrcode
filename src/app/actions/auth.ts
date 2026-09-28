'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { authRateLimiter } from '@/lib/rateLimit'
import { getServerActionClientIp } from '@/lib/requestIp'
import { logger } from '@/lib/logger'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const LoginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const RegisterSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export async function login(formData: FormData) {
  const ip = await getServerActionClientIp()
  const rateLimitResult = await authRateLimiter.check(`login_${ip}`)
  if (!rateLimitResult.success) {
    logger.rateLimitHit('auth.login', { ip })
    redirect('/login?error=Too+many+attempts.+Please+try+again+in+a+minute.')
  }

  const rawEmail = formData.get('email') as string
  const rawPassword = formData.get('password') as string

  const parsed = LoginSchema.safeParse({ email: rawEmail, password: rawPassword })
  if (!parsed.success) {
    redirect(`/login?error=${encodeURIComponent(parsed.error.errors[0]?.message || 'Invalid input')}`)
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    logger.authFailure('invalid_credentials', { ip })
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/dashboard')
}

export async function register(formData: FormData) {
  const ip = await getServerActionClientIp()
  const rateLimitResult = await authRateLimiter.check(`register_${ip}`)
  if (!rateLimitResult.success) {
    logger.rateLimitHit('auth.register', { ip })
    redirect('/register?error=Too+many+attempts.+Please+try+again+in+a+minute.')
  }

  const rawName = formData.get('name') as string
  const rawEmail = formData.get('email') as string
  const rawPassword = formData.get('password') as string
  const rawConfirm = formData.get('confirmPassword') as string

  const parsed = RegisterSchema.safeParse({
    name: rawName,
    email: rawEmail,
    password: rawPassword,
    confirmPassword: rawConfirm,
  })

  if (!parsed.success) {
    redirect(`/register?error=${encodeURIComponent(parsed.error.errors[0]?.message || 'Invalid input')}`)
  }

  const { email, password, name } = parsed.data
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  })

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`)
  }

  // Provision 14-day trial in subscriptions table for the new user
  if (data?.user?.id) {
    try {
      const db = getServiceClient()
      await db.from('subscriptions').upsert(
        {
          user_id: data.user.id,
          status: 'trialing',
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: 'user_id' }
      )
    } catch (err) {
      console.error('[register] Failed to initialize trial subscription:', err)
    }
  }

  redirect('/dashboard/settings/business')
}

export async function signInWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  })

  if (error) {
    console.error('[signInWithGoogle] OAuth init error:', error)
    redirect('/login?error=Failed+to+initiate+Google+sign+in')
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
