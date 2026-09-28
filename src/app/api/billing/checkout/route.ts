import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkoutRateLimiter } from '@/lib/rateLimit'
import { getClientIp } from '@/lib/requestIp'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  // 1. CSRF Origin Verification
  const origin = req.headers.get('origin')
  const host = req.headers.get('host')
  if (origin && host) {
    try {
      const originHost = new URL(origin).host
      if (originHost !== host) {
        return NextResponse.json({ error: 'Cross-origin request forbidden' }, { status: 403 })
      }
    } catch {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
    }
  }

  // 2. Server-side Authentication (User must be logged in)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 3. Rate Limiting (5 checkout creations per minute per user/IP)
  const ip = getClientIp(req)
  const rateLimitResult = await checkoutRateLimiter.check(`${user.id}_${ip}`)
  if (!rateLimitResult.success) {
    logger.rateLimitHit('checkout', { userId: user.id, ip })
    return NextResponse.json(
      { error: 'Too many checkout requests. Please wait a moment.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)),
        },
      }
    )
  }

  // 4. Server-controlled Billing Configuration
  const storeId = process.env.LEMONSQUEEZY_STORE_ID
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID
  const apiKey = process.env.LEMONSQUEEZY_API_KEY
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!storeId || !variantId || !apiKey) {
    console.error('[checkout] Lemon Squeezy billing environment variables are not configured')
    return NextResponse.json({ error: 'Billing not configured' }, { status: 500 })
  }

  try {
    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: user.email,
              custom: {
                user_id: user.id,
              },
            },
            product_options: {
              redirect_url: `${appUrl}/dashboard?checkout=success`,
              receipt_link_url: `${appUrl}/dashboard/billing`,
            },
          },
          relationships: {
            store: {
              data: { type: 'stores', id: storeId },
            },
            variant: {
              data: { type: 'variants', id: variantId },
            },
          },
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[checkout] Lemon Squeezy API error:', errorText)
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
    }

    const data = await response.json()
    const checkoutUrl = data.data?.attributes?.url

    if (!checkoutUrl) {
      return NextResponse.json({ error: 'No checkout URL returned' }, { status: 500 })
    }

    return NextResponse.json({ url: checkoutUrl })
  } catch (err) {
    console.error('[checkout] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
