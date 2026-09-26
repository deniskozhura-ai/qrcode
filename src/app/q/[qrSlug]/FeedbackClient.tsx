'use client'

import { useState, useRef, useTransition } from 'react'

const CATEGORIES = [
  { value: 'service', label: 'Service' },
  { value: 'waiting_time', label: 'Waiting time' },
  { value: 'quality', label: 'Quality' },
  { value: 'staff', label: 'Staff' },
  { value: 'price', label: 'Price' },
  { value: 'cleanliness', label: 'Cleanliness' },
  { value: 'other', label: 'Other' },
]

type Stage = 'rating' | 'form' | 'success'

interface Props {
  businessId: string
  qrCodeId: string
  brandColor: string
  googleReviewUrl: string | null
}

export default function FeedbackClient({ businessId, qrCodeId, brandColor, googleReviewUrl }: Props) {
  const [stage, setStage] = useState<Stage>('rating')
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [category, setCategory] = useState('')
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const [isSubmitting, startSubmit] = useTransition()
  const honeypot = useRef('')

  const accent = brandColor || '#18181b'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Honeypot check
    if (honeypot.current) return

    startSubmit(async () => {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          qr_code_id: qrCodeId,
          rating,
          category: category || null,
          message: message.trim().slice(0, 1000) || null,
        }),
      })

      if (res.ok) {
        setStage('success')
        // Track analytics
        fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event_type: 'feedback_submitted', business_id: businessId, qr_code_id: qrCodeId }),
        })
      }
    })
  }

  async function handleCopyFeedback() {
    const text = message.trim()
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
      // Track copy event
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: 'feedback_copied', business_id: businessId, qr_code_id: qrCodeId }),
      })
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  function handleGoogleClick() {
    if (!googleReviewUrl) return
    if (!googleReviewUrl.startsWith('http://') && !googleReviewUrl.startsWith('https://')) {
      console.warn('Rejected unsafe external review URL')
      return
    }
    // Track click
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'google_review_clicked', business_id: businessId, qr_code_id: qrCodeId }),
    })
    window.open(googleReviewUrl, '_blank', 'noopener,noreferrer')
  }

  // ─────────── RATING STAGE ───────────
  if (stage === 'rating') {
    return (
      <div className="flex flex-col items-center gap-6">
        <p className="text-base text-zinc-500">Tap a star to rate</p>
        <div className="flex gap-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
              className="focus:outline-none transition-transform active:scale-90"
              style={{ transform: hoveredRating >= star ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.15s ease' }}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => {
                setRating(star)
                setStage('form')
                fetch('/api/analytics', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ event_type: 'rating_submitted', business_id: businessId, qr_code_id: qrCodeId }),
                })
              }}
            >
              <svg
                className="w-14 h-14 transition-colors duration-150"
                viewBox="0 0 24 24"
                fill={hoveredRating >= star ? '#facc15' : '#e4e4e7'}
                stroke={hoveredRating >= star ? '#f59e0b' : '#d4d4d8'}
                strokeWidth={0.5}
              >
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ─────────── FORM STAGE ───────────
  if (stage === 'form') {
    const isLow = rating <= 3
    return (
      <form onSubmit={handleSubmit} className="w-full space-y-5 text-left animate-in fade-in slide-in-from-bottom-3 duration-400">
        {/* Stars recap */}
        <div className="flex justify-center gap-1 mb-2">
          {[1,2,3,4,5].map(s => (
            <svg key={s} className="w-7 h-7" viewBox="0 0 24 24"
              fill={s <= rating ? '#facc15' : '#e4e4e7'}
              stroke={s <= rating ? '#f59e0b' : '#d4d4d8'}
              strokeWidth={0.5}
            >
              <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          ))}
        </div>

        {isLow ? (
          <p className="text-center text-zinc-600 font-medium">We&apos;re sorry your experience wasn&apos;t perfect.<br/><span className="text-sm text-zinc-400">What could we improve?</span></p>
        ) : (
          <p className="text-center text-zinc-600 font-medium">We&apos;d love to know more! 😊<br/><span className="text-sm text-zinc-400">Tell us what made it great.</span></p>
        )}

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Category <span className="text-zinc-400 font-normal">(optional)</span></label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(category === c.value ? '' : c.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  category === c.value
                    ? 'text-white border-transparent'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400'
                }`}
                style={category === c.value ? { backgroundColor: accent, borderColor: accent } : {}}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Tell us about your experience <span className="text-zinc-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={4}
            maxLength={1000}
            placeholder={isLow ? 'What could we have done better?' : 'What did you like about your visit?'}
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="block w-full rounded-xl border border-zinc-200 py-3 px-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-offset-1 text-sm leading-relaxed bg-zinc-50 resize-none"
            style={{ '--tw-ring-color': accent } as React.CSSProperties}
          />
          <p className="text-right text-xs text-zinc-400 mt-1">{message.length}/1000</p>
        </div>

        {/* Honeypot (hidden from real users) */}
        <input
          type="text"
          name="_hp"
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          onChange={e => { honeypot.current = e.target.value }}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-xl text-white font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: accent }}
        >
          {isSubmitting ? 'Sending…' : 'Send Feedback'}
        </button>

        <button
          type="button"
          onClick={() => { setStage('rating'); setRating(0); setCategory(''); setMessage('') }}
          className="w-full text-sm text-zinc-400 hover:text-zinc-600 py-1"
        >
          ← Change rating
        </button>
      </form>
    )
  }

  // ─────────── SUCCESS STAGE ───────────
  return (
    <div className="w-full animate-in fade-in zoom-in-95 duration-500 space-y-5">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accent}22` }}>
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        {rating <= 3 ? (
          <>
            <h2 className="text-xl font-bold text-zinc-900">Thank you for telling us.</h2>
            <p className="text-zinc-500 text-sm max-w-xs">Your feedback has been sent directly to the team so we can improve.</p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-zinc-900">Thanks for your feedback!</h2>
            <p className="text-zinc-500 text-sm max-w-xs">We&apos;re really glad you had a great experience.</p>
          </>
        )}
      </div>

      {/* Show user's text back to them */}
      {message.trim() && (
        <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
          <p className="text-xs font-medium text-zinc-400 mb-2">Your feedback:</p>
          <p className="text-sm text-zinc-700 leading-relaxed">&ldquo;{message.trim()}&rdquo;</p>
        </div>
      )}

      {/* Actions — available for ALL ratings (no gating) */}
      <div className="space-y-3">
        {message.trim() && (
          <button
            onClick={handleCopyFeedback}
            className="w-full py-3.5 rounded-xl border-2 font-semibold text-sm transition-all flex items-center justify-center gap-2"
            style={{ borderColor: accent, color: accent }}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Copied ✓
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                Copy my feedback
              </>
            )}
          </button>
        )}

        {googleReviewUrl && (
          <button
            onClick={handleGoogleClick}
            className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
            style={{ backgroundColor: accent }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/>
            </svg>
            Leave a Google Review
          </button>
        )}

        <p className="text-center text-xs text-zinc-400 pt-1">
          Opening Google Review will take you to an external website.
        </p>
      </div>
    </div>
  )
}
