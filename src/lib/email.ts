/**
 * Email Notification Service — ReviewFlow
 *
 * Sends transactional emails via Resend.
 * Only fires when RESEND_API_KEY is configured and the user has opted in
 * (notify_negative_feedback / notify_weekly_summary flags in profiles).
 *
 * All emails are fire-and-forget — failures are logged but never block
 * the core feedback/analytics flow.
 */

import { logger } from '@/lib/logger'

interface NegativeFeedbackEmailOptions {
  ownerEmail: string
  ownerName: string | null
  businessName: string
  rating: number
  category: string | null
  message: string | null
  feedbackId: string
}

interface WeeklySummaryEmailOptions {
  ownerEmail: string
  ownerName: string | null
  businessName: string
  weekStart: string
  totalFeedback: number
  averageRating: number
  negativeCount: number
  unresolvedCount: number
}

function getResendApiKey(): string | null {
  return process.env.RESEND_API_KEY ?? null
}

function getFromAddress(): string {
  return process.env.EMAIL_FROM ?? 'ReviewFlow <notifications@reviewflow.app>'
}

async function sendEmail(payload: {
  to: string
  subject: string
  html: string
}): Promise<boolean> {
  const apiKey = getResendApiKey()
  if (!apiKey) {
    logger.warn('email.skipped', { reason: 'RESEND_API_KEY not configured', to: payload.to })
    return false
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: getFromAddress(),
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      logger.error('email.send_failed', { status: res.status, to: payload.to, body })
      return false
    }

    logger.info('email.sent', { to: payload.to, subject: payload.subject })
    return true
  } catch (err) {
    logger.error('email.error', {
      to: payload.to,
      error: String(err),
    })
    return false
  }
}

const STAR_EMOJIS: Record<number, string> = {
  1: '⭐',
  2: '⭐⭐',
  3: '⭐⭐⭐',
  4: '⭐⭐⭐⭐',
  5: '⭐⭐⭐⭐⭐',
}

/**
 * Sends an immediate alert when a customer leaves a negative review (rating ≤ 3).
 * Only fires if the business owner has opted in to negative feedback notifications.
 */
export async function sendNegativeFeedbackAlert(
  opts: NegativeFeedbackEmailOptions
): Promise<void> {
  const stars = STAR_EMOJIS[opts.rating] ?? String(opts.rating)
  const greeting = opts.ownerName ? `Hi ${opts.ownerName},` : 'Hello,'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;margin:0;padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">
    <div style="background:#18181b;padding:24px 28px;">
      <h1 style="color:#fff;margin:0;font-size:18px;font-weight:700;">ReviewFlow</h1>
      <p style="color:#a1a1aa;margin:4px 0 0;font-size:13px;">New feedback alert for ${opts.businessName}</p>
    </div>
    <div style="padding:28px;">
      <p style="color:#18181b;margin:0 0 20px;">${greeting}</p>
      <p style="color:#3f3f46;margin:0 0 20px;line-height:1.6;">
        A customer left a <strong>${opts.rating}-star review</strong> for <strong>${opts.businessName}</strong>. 
        This may need your attention.
      </p>

      <div style="background:#fafafa;border:1px solid #e4e4e7;border-radius:12px;padding:20px;margin:0 0 24px;">
        <div style="font-size:22px;margin:0 0 12px;">${stars}</div>
        ${opts.category ? `<p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 6px;">Category</p><p style="color:#18181b;margin:0 0 14px;font-weight:500;">${opts.category}</p>` : ''}
        ${opts.message ? `<p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 6px;">Customer Message</p><p style="color:#18181b;margin:0;line-height:1.6;font-style:italic;">"${opts.message}"</p>` : '<p style="color:#71717a;font-style:italic;margin:0;">No message provided.</p>'}
      </div>

      <a href="${appUrl}/dashboard/feedback" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;">
        View &amp; Resolve Feedback →
      </a>

      <p style="color:#a1a1aa;font-size:12px;margin:24px 0 0;line-height:1.6;">
        You're receiving this because you have negative feedback alerts enabled for ${opts.businessName}.<br>
        <a href="${appUrl}/dashboard/settings/account" style="color:#71717a;">Manage notification preferences</a>
      </p>
    </div>
  </div>
</body>
</html>`

  await sendEmail({
    to: opts.ownerEmail,
    subject: `${stars} New ${opts.rating}-star feedback for ${opts.businessName}`,
    html,
  })
}

/**
 * Sends a weekly digest summarizing the business's feedback performance.
 * Only fires if the user opted into weekly summaries.
 */
export async function sendWeeklySummaryEmail(
  opts: WeeklySummaryEmailOptions
): Promise<void> {
  const greeting = opts.ownerName ? `Hi ${opts.ownerName},` : 'Hello,'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const avgDisplay = opts.averageRating > 0 ? opts.averageRating.toFixed(1) : 'N/A'

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;margin:0;padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">
    <div style="background:#18181b;padding:24px 28px;">
      <h1 style="color:#fff;margin:0;font-size:18px;font-weight:700;">ReviewFlow</h1>
      <p style="color:#a1a1aa;margin:4px 0 0;font-size:13px;">Weekly summary for ${opts.businessName}</p>
    </div>
    <div style="padding:28px;">
      <p style="color:#18181b;margin:0 0 8px;">${greeting}</p>
      <p style="color:#3f3f46;margin:0 0 24px;">Here's your feedback summary for the week of <strong>${opts.weekStart}</strong>.</p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0 0 24px;">
        <div style="background:#fafafa;border:1px solid #e4e4e7;border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#18181b;">${opts.totalFeedback}</div>
          <div style="font-size:12px;color:#71717a;margin-top:4px;">Total Reviews</div>
        </div>
        <div style="background:#fafafa;border:1px solid #e4e4e7;border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#18181b;">${avgDisplay}★</div>
          <div style="font-size:12px;color:#71717a;margin-top:4px;">Avg Rating</div>
        </div>
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#c2410c;">${opts.negativeCount}</div>
          <div style="font-size:12px;color:#9a3412;margin-top:4px;">Negative (≤3★)</div>
        </div>
        <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#a16207;">${opts.unresolvedCount}</div>
          <div style="font-size:12px;color:#713f12;margin-top:4px;">Unresolved</div>
        </div>
      </div>

      <a href="${appUrl}/dashboard" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;">
        Open Dashboard →
      </a>

      <p style="color:#a1a1aa;font-size:12px;margin:24px 0 0;">
        You're receiving this weekly digest for ${opts.businessName}.<br>
        <a href="${appUrl}/dashboard/settings/account" style="color:#71717a;">Manage preferences</a>
      </p>
    </div>
  </div>
</body>
</html>`

  await sendEmail({
    to: opts.ownerEmail,
    subject: `Weekly summary: ${opts.totalFeedback} reviews, ${avgDisplay}★ avg — ${opts.businessName}`,
    html,
  })
}
