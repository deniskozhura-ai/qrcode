'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const rating = parseInt(searchParams.get('rating') || '0')

  return (
    <div className="text-center animate-in zoom-in duration-500">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-2">Thank you for telling us.</h1>
      {rating <= 3 ? (
        <p className="text-zinc-600 mb-8 max-w-sm mx-auto">Your feedback has been sent directly to the team so we can improve.</p>
      ) : (
        <p className="text-zinc-600 mb-8 max-w-sm mx-auto">We really appreciate your feedback.</p>
      )}
    </div>
  )
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <Suspense fallback={<div className="text-sm text-zinc-400">Loading...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  )
}
