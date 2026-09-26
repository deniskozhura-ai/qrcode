'use client'

import { useState, useRef, useTransition } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { createQr, deleteQr } from '@/app/actions/qr'

interface QrItem {
  id: string
  name: string
  slug: string
  active: boolean
  created_at: string
  scans: number
  feedbackCount: number
  avgRating: string | null
}

interface Props {
  businessId: string
  qrCodes: QrItem[]
  appUrl: string
}

export default function QrManagement({ businessId, qrCodes, appUrl }: Props) {
  const [newName, setNewName] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({})
  const [isCreating, startCreate] = useTransition()

  function getQrUrl(slug: string) {
    return `${appUrl}/q/${slug}`
  }

  function handleCopyLink(slug: string) {
    navigator.clipboard.writeText(getQrUrl(slug)).then(() => {
      setCopied(slug)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  function handleDownloadPng(slug: string, name: string) {
    const canvas = document.querySelector(`canvas[data-slug="${slug}"]`) as HTMLCanvasElement
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `reviewflow-${name.replace(/\s+/g, '-').toLowerCase()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">QR Codes</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage feedback QR codes for different locations.</p>
        </div>

        <form
          action={createQr}
          className="flex gap-2 items-center"
        >
          <input type="hidden" name="business_id" value={businessId} />
          <input
            type="text"
            name="name"
            required
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder='e.g. "Table 1"'
            className="w-40 px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          <button
            type="submit"
            disabled={isCreating || !newName.trim()}
            className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {isCreating ? 'Creating…' : '+ Create QR'}
          </button>
        </form>
      </div>

      {qrCodes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="font-semibold text-zinc-900 mb-1">No QR codes yet</h3>
          <p className="text-zinc-500 text-sm">Create your first QR code to start collecting feedback.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {qrCodes.map(qr => (
            <div key={qr.id} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden flex flex-col">
              {/* QR Preview */}
              <div className="bg-zinc-50 p-6 flex flex-col items-center border-b border-zinc-100">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-100 mb-3">
                  <QRCodeCanvas
                    value={getQrUrl(qr.slug)}
                    size={160}
                    data-slug={qr.slug}
                    ref={(el) => { canvasRefs.current[qr.slug] = el }}
                    level="M"
                  />
                </div>
                <p className="font-semibold text-zinc-900 text-base">{qr.name}</p>
                <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-full px-4">
                  {appUrl}/q/{qr.slug}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 divide-x divide-zinc-100 border-b border-zinc-100">
                <div className="px-3 py-3 text-center">
                  <p className="text-xs text-zinc-400 mb-0.5">Scans</p>
                  <p className="font-bold text-zinc-900">{qr.scans}</p>
                </div>
                <div className="px-3 py-3 text-center">
                  <p className="text-xs text-zinc-400 mb-0.5">Feedback</p>
                  <p className="font-bold text-zinc-900">{qr.feedbackCount}</p>
                </div>
                <div className="px-3 py-3 text-center">
                  <p className="text-xs text-zinc-400 mb-0.5">Avg Rating</p>
                  <p className="font-bold text-zinc-900">{qr.avgRating ?? '—'}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 flex flex-wrap gap-2">
                <button
                  onClick={() => handleDownloadPng(qr.slug, qr.name)}
                  className="flex-1 px-3 py-1.5 text-xs font-medium border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-700 transition-colors"
                >
                  ↓ PNG
                </button>
                <button
                  onClick={() => handleCopyLink(qr.slug)}
                  className="flex-1 px-3 py-1.5 text-xs font-medium border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-700 transition-colors"
                >
                  {copied === qr.slug ? '✓ Copied' : '🔗 Copy link'}
                </button>
                <form action={deleteQr} className="flex-1">
                  <input type="hidden" name="id" value={qr.id} />
                  <button
                    type="submit"
                    className="w-full px-3 py-1.5 text-xs font-medium border border-red-100 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                    onClick={e => { if (!confirm(`Delete "${qr.name}"?`)) e.preventDefault() }}
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
