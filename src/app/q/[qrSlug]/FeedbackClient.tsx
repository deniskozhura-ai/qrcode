'use client'

import { useState, useRef, useTransition } from 'react'
import {
  Star,
  CheckCircle2,
  Copy,
  Check,
  ArrowLeft,
  Loader2,
  ExternalLink,
} from 'lucide-react'

const CATEGORIES = [
  { value: 'service', label: 'Service' },
  { value: 'waiting_time', label: 'Waiting time' },
  { value: 'quality', label: 'Quality' },
  { value: 'staff', label: 'Staff' },
  { value: 'price', label: 'Price' },
  { value: 'cleanliness', label: 'Cleanliness' },
  { value: 'other', label: 'Other' },
]

const RATING_LABELS: Record<number, string> = {
  1: 'Terrible',
  2: 'Poor',
  3: 'Average',
  4: 'Very Good',
  5: 'Outstanding!',
}

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
        fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event_type: 'feedback_submitted', business_id: businessId, qr_code_id: qrCodeId }),
        }).catch(() => {})
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
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: 'feedback_copied', business_id: businessId, qr_code_id: qrCodeId }),
      }).catch(() => {})
    } catch {
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
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'google_review_clicked', business_id: businessId, qr_code_id: qrCodeId }),
    }).catch(() => {})
    window.open(googleReviewUrl, '_blank', 'noopener,noreferrer')
  }

  // ─────────── STAGE 1: RATING SELECTION ───────────
  if (stage === 'rating') {
    const currentActiveRating = hoveredRating || rating
    return (
      <div className="flex flex-col items-center gap-5 py-2">
        <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Tap a star to rate
        </p>

        {/* 5 Big Stars */}
        <div className="flex gap-2 sm:gap-3 py-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
              className="focus:outline-hidden transition-all duration-150 active:scale-90 p-1"
              style={{
                transform: currentActiveRating >= star ? 'scale(1.12)' : 'scale(1)',
              }}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => {
                setRating(star)
                setStage('form')
                fetch('/api/analytics', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ event_type: 'rating_submitted', business_id: businessId, qr_code_id: qrCodeId }),
                }).catch(() => {})
              }}
            >
              <Star
                className="w-11 h-11 sm:w-13 sm:h-13 transition-colors duration-150"
                fill={currentActiveRating >= star ? '#facc15' : 'transparent'}
                stroke={currentActiveRating >= star ? '#eab308' : '#d4d4d8'}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>

        {/* Dynamic Label Indicator */}
        <div className="h-6">
          {currentActiveRating > 0 ? (
            <span className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200 tracking-tight">
              {RATING_LABELS[currentActiveRating]}
            </span>
          ) : (
            <span className="text-xs text-zinc-400">Select rating</span>
          )}
        </div>
      </div>
    )
  }

  // ─────────── STAGE 2: FORM / FEEDBACK ───────────
  if (stage === 'form') {
    const isLow = rating <= 3

    return (
      <form onSubmit={handleSubmit} className="w-full space-y-5 text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Stars Summary Recap */}
        <div className="flex items-center justify-center gap-1.5 p-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200/60 dark:border-zinc-800">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className="w-5 h-5"
                fill={s <= rating ? '#facc15' : 'transparent'}
                stroke={s <= rating ? '#eab308' : '#a1a1aa'}
                strokeWidth={1.5}
              />
            ))}
          </div>
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 ml-1">
            {RATING_LABELS[rating]}
          </span>
        </div>

        {/* Dynamic Heading based on rating */}
        <div className="text-center px-2">
          {isLow ? (
            <div>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                We&apos;re sorry your experience wasn&apos;t ideal.
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                How could we have made it better?
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                We&apos;re thrilled you enjoyed it! 😊
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Tell us what made your visit special.
              </p>
            </div>
          )}
        </div>

        {/* Category Pills */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            Category <span className="text-zinc-400 font-normal">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => {
              const isSelected = category === c.value
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(isSelected ? '' : c.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150 ${
                    isSelected
                      ? 'text-white border-transparent shadow-xs'
                      : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                  }`}
                  style={isSelected ? { backgroundColor: accent, borderColor: accent } : {}}
                >
                  {c.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Message Input */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Your Comments <span className="text-zinc-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={3}
            maxLength={1000}
            placeholder={
              isLow
                ? 'Please share any details that can help our manager fix this…'
                : 'What did you like best about our service, food, or ambiance?'
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="block w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 py-3 px-3.5 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-xs sm:text-sm leading-relaxed bg-zinc-50 dark:bg-zinc-800/80 resize-none focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-colors"
          />
          <p className="text-right text-[10px] text-zinc-400 mt-1">{message.length}/1000</p>
        </div>

        {/* Honeypot Spam Guard */}
        <input
          type="text"
          name="_hp"
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          onChange={(e) => {
            honeypot.current = e.target.value
          }}
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 rounded-2xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
          style={{ backgroundColor: accent }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Sending Feedback…</span>
            </>
          ) : (
            <span>Send Feedback</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setStage('rating')
            setRating(0)
            setCategory('')
            setMessage('')
          }}
          className="w-full text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 py-1 flex items-center justify-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>Change rating</span>
        </button>
      </form>
    )
  }

  // ─────────── STAGE 3: SUCCESS ───────────
  return (
    <div className="w-full animate-in fade-in zoom-in-95 duration-400 space-y-5">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs"
          style={{ backgroundColor: `${accent}18` }}
        >
          <CheckCircle2 className="w-8 h-8" style={{ color: accent }} />
        </div>

        {rating <= 3 ? (
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Thank you for sharing your feedback.
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm mt-1 max-w-xs leading-relaxed">
              Your message was delivered directly to management so we can take immediate action and improve.
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Thanks for your wonderful review!
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm mt-1 max-w-xs leading-relaxed">
              We&apos;re thrilled you had a great experience with us today.
            </p>
          </div>
        )}
      </div>

      {/* Show user's text back to them */}
      {message.trim() && (
        <div className="bg-zinc-50 dark:bg-zinc-800/70 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">Your message:</p>
          <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed italic">
            &ldquo;{message.trim()}&rdquo;
          </p>
        </div>
      )}

      {/* Action buttons (compliant with Google review non-gating policy) */}
      <div className="space-y-2.5 pt-2">
        {message.trim() && (
          <button
            onClick={handleCopyFeedback}
            className="w-full py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-semibold text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 transition-colors flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 dark:text-emerald-400">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-zinc-500" />
                <span>Copy my review text</span>
              </>
            )}
          </button>
        )}

        {googleReviewUrl && (
          <button
            onClick={handleGoogleClick}
            className="w-full py-3.5 px-4 rounded-2xl text-white font-semibold text-xs sm:text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2 shadow-xs"
            style={{ backgroundColor: accent }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" />
            </svg>
            <span>Post on Google Reviews</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </button>
        )}
      </div>
    </div>
  )
}
