import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const storeId = process.env.LEMONSQUEEZY_STORE_ID
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID
  const apiKey = process.env.LEMONSQUEEZY_API_KEY
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!storeId || !variantId || !apiKey) {
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
      const error = await response.text()
      console.error('[checkout] Lemon Squeezy error:', error)
      return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 })
    }

    const data = await response.json()
    const checkoutUrl = data.data?.attributes?.url

    if (!checkoutUrl) {
      return NextResponse.json({ error: 'No checkout URL returned' }, { status: 500 })
    }

    return NextResponse.json({ url: checkoutUrl })
  } catch (err) {
    console.error('[checkout] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
