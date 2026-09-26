import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export function getSafeRedirectUrl(origin: string, nextParam: string | null): string {
  if (!nextParam) return `${origin}/dashboard`
  try {
    // Must be a relative path strictly starting with a single '/' and no backslashes
    if (
      !nextParam.startsWith('/') ||
      nextParam.startsWith('//') ||
      nextParam.startsWith('/\\') ||
      nextParam.includes('\\')
    ) {
      return `${origin}/dashboard`
    }
    const resolved = new URL(nextParam, origin)
    // Origin must strictly match application origin
    if (resolved.origin !== origin) {
      return `${origin}/dashboard`
    }
    return resolved.toString()
  } catch {
    return `${origin}/dashboard`
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')

  if (!code) {
    console.warn('[auth callback] Missing code parameter in OAuth callback')
    return NextResponse.redirect(`${requestUrl.origin}/login?error=Missing+authorization+code`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    console.error('[auth callback] Failed to exchange code for session:', error?.message)
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(error?.message || 'Authentication failed')}`
    )
  }

  // Ensure new OAuth users have a trial subscription initialized
  const user = data.session.user
  if (user) {
    try {
      const db = getServiceClient()
      const { data: existingSub } = await db
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!existingSub) {
        await db.from('subscriptions').insert({
          user_id: user.id,
          status: 'trialing',
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        })
      }
    } catch (err) {
      console.error('[auth callback] Error ensuring trial subscription:', err)
    }
  }

  // Safe redirect destination (prevents Open Redirect attacks)
  const safeRedirect = getSafeRedirectUrl(requestUrl.origin, next)
  return NextResponse.redirect(safeRedirect)
}
