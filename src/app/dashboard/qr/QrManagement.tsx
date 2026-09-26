'use client'

import { useState, useRef, useTransition } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import {
  QrCode,
  Plus,
  Download,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Star,
  MapPin,
  X,
  Maximize2,
} from 'lucide-react'
import { createQr, deleteQr } from '@/app/actions/qr'
import PageHeader from '@/components/dashboard/PageHeader'
import EmptyState from '@/components/dashboard/EmptyState'

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
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [previewQr, setPreviewQr] = useState<QrItem | null>(null)
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({})
  const [isPending, startTransition] = useTransition()

  function getQrUrl(slug: string) {
    return `${appUrl}/q/${slug}`
  }

  function handleCopyLink(slug: string) {
    const url = getQrUrl(slug)
    navigator.clipboard.writeText(url).then(() => {
      setCopiedSlug(slug)
      setTimeout(() => setCopiedSlug(null), 2000)
    })
  }

  function handleDownloadPng(slug: string, name: string) {
    const canvas = document.querySelector(`canvas[data-slug="${slug}"]`) as HTMLCanvasElement
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `reviewflow-${name.replace(/\s+/g, '-').toLowerCase()}-qr.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const namePresets = ['Table 1', 'Table 2', 'Bar Counter', 'Front Desk', 'Takeout Box']

  return (
    <div className="space-y-6">
      <PageHeader
        title="QR Codes"
        description="Deploy unique QR codes to track customer sentiment across different tables, counters, and branches."
        badge={
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
            {qrCodes.length} {qrCodes.length === 1 ? 'code' : 'codes'}
          </span>
        }
      >
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 text-white text-xs sm:text-sm font-semibold hover:bg-zinc-800 transition-colors shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>New QR Code</span>
        </button>
      </PageHeader>

      {/* Create QR Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-foreground shrink-0 border border-border">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Create QR Code</h3>
                <p className="text-xs text-muted-foreground">Assign a name or location for this QR code</p>
              </div>
            </div>

            <form
              action={(formData) => {
                startTransition(async () => {
                  await createQr(formData)
                  setNewName('')
                  setIsModalOpen(false)
                })
              }}
              className="space-y-4"
            >
              <input type="hidden" name="business_id" value={businessId} />

              <div>
                <label htmlFor="name" className="block text-xs font-medium text-foreground mb-1.5">
                  Location / Label Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Table 1, Reception Desk"
                  className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              {/* Quick presets */}
              <div>
                <span className="text-[11px] font-medium text-muted-foreground block mb-1.5">Quick Suggestions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {namePresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewName(preset)}
                      className="px-2.5 py-1 text-xs rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-foreground transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium border border-border rounded-xl hover:bg-muted transition-colors text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !newName.trim()}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 disabled:opacity-50 transition-colors shadow-2xs"
                >
                  {isPending ? 'Generating…' : 'Generate QR Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Large Preview Modal */}
      {previewQr && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-3xl border border-border p-6 shadow-2xl text-center relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setPreviewQr(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-xs font-medium text-foreground mb-4">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{previewQr.name}</span>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-border/80 shadow-inner flex items-center justify-center mb-4">
              <QRCodeCanvas
                value={getQrUrl(previewQr.slug)}
                size={220}
                level="H"
                includeMargin
              />
            </div>

            <p className="text-xs text-muted-foreground truncate mb-6 px-2">
              {getQrUrl(previewQr.slug)}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => handleDownloadPng(previewQr.slug, previewQr.name)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save PNG</span>
              </button>
              <button
                onClick={() => handleCopyLink(previewQr.slug)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border text-foreground text-xs font-medium hover:bg-muted transition-colors"
              >
                {copiedSlug === previewQr.slug ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Codes Grid */}
      {qrCodes.length === 0 ? (
        <div className="py-12 bg-card rounded-2xl border border-border/80">
          <EmptyState
            icon={QrCode}
            title="No QR codes created yet"
            description="Create your first QR code to place on dining tables, reception desks, or receipts to capture customer feedback."
            actionLabel="+ Create First QR Code"
            onAction={() => setIsModalOpen(true)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {qrCodes.map((qr) => {
            const qrUrl = getQrUrl(qr.slug)

            return (
              <div
                key={qr.id}
                className="bg-card rounded-2xl border border-border/80 shadow-2xs card-hover flex flex-col justify-between overflow-hidden"
              >
                {/* Header */}
                <div className="p-4 border-b border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-border/60">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <p className="font-semibold text-foreground text-sm truncate">{qr.name}</p>
                  </div>

                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400">
                    Active
                  </span>
                </div>

                {/* QR Canvas Container */}
                <div className="p-6 bg-muted/20 flex flex-col items-center justify-center border-b border-border/60 relative group">
                  <div className="bg-white p-3.5 rounded-2xl border border-border shadow-xs transition-transform duration-200 group-hover:scale-102">
                    <QRCodeCanvas
                      value={qrUrl}
                      size={144}
                      data-slug={qr.slug}
                      ref={(el) => {
                        canvasRefs.current[qr.slug] = el
                      }}
                      level="M"
                    />
                  </div>

                  <button
                    onClick={() => setPreviewQr(qr)}
                    className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Expand / Print</span>
                  </button>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-3 divide-x divide-border/60 border-b border-border/60 text-center py-2.5 bg-card text-xs">
                  <div className="px-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Scans</span>
                    <span className="font-bold text-foreground text-sm">{qr.scans}</span>
                  </div>
                  <div className="px-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Feedback</span>
                    <span className="font-bold text-foreground text-sm">{qr.feedbackCount}</span>
                  </div>
                  <div className="px-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Rating</span>
                    <span className="font-bold text-foreground text-sm flex items-center justify-center gap-0.5">
                      {qr.avgRating ? `${qr.avgRating}` : '—'}
                      {qr.avgRating && <Star className="w-3 h-3 fill-amber-400 text-amber-500" />}
                    </span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-3 bg-muted/10 flex items-center gap-1.5">
                  <button
                    onClick={() => handleDownloadPng(qr.slug, qr.name)}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-border bg-card rounded-lg hover:bg-muted transition-colors text-foreground"
                    title="Download PNG image"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PNG</span>
                  </button>

                  <button
                    onClick={() => handleCopyLink(qr.slug)}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-border bg-card rounded-lg hover:bg-muted transition-colors text-foreground"
                    title="Copy customer review link"
                  >
                    {copiedSlug === qr.slug ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <a
                    href={qrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Open live customer feedback page"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <form action={deleteQr}>
                    <input type="hidden" name="id" value={qr.id} />
                    <button
                      type="submit"
                      className="p-1.5 rounded-lg border border-transparent text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete QR code"
                      onClick={(e) => {
                        if (!confirm(`Delete "${qr.name}"? Historical analytics will remain.`)) {
                          e.preventDefault()
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
