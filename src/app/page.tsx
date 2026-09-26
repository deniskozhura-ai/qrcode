import Link from 'next/link'
import {
  QrCode,
  Star,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Check,
  ChevronRight,
  ExternalLink,
  HeartHandshake
} from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col min-h-full bg-background text-foreground selection:bg-zinc-900 selection:text-white">
      {/* Top Notice / Announcement */}
      <div className="border-b border-border/60 bg-muted/30 px-4 py-2 text-center text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Launch offer:</span> Get full access free for 14 days — no credit card required.
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs group-hover:scale-105 transition-transform">
              <QrCode className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">ReviewFlow</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-all shadow-xs"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 sm:pt-24 pb-20 px-4 sm:px-6">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[600px] h-96 bg-zinc-200/40 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-card/80 text-xs font-semibold text-muted-foreground shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Smart QR Sentiment & Review Routing</span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.08]">
            Turn guest feedback into{' '}
            <span className="bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 bg-clip-text text-transparent">
              5-star Google reviews.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed font-normal">
            Place branded QR codes on tables, receipts, or counters. Delighted customers are guided straight to Google Reviews, while unhappy guests share private feedback with your team before leaving a negative public review.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/register"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <span>Get Started in 2 Minutes</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#demo"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-border bg-card hover:bg-muted/40 text-foreground text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-2xs"
            >
              <span>See How It Works</span>
            </a>
          </div>

          {/* Trust badges */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>100% Google policy compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>No customer app download</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Instant table-level alerts</span>
            </div>
          </div>
        </div>

        {/* Product Visual Mockup */}
        <div id="demo" className="max-w-5xl mx-auto mt-16 sm:mt-20">
          <div className="rounded-3xl border border-border/80 bg-card p-3 sm:p-5 shadow-xl shadow-zinc-950/5">
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* Left Mock: Customer Scan Experience */}
              <div className="lg:col-span-5 bg-card rounded-2xl border border-border/80 p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
                      B
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">Bistro & Lounge</div>
                      <div className="text-[10px] text-muted-foreground">Table 12 • Scanned 2m ago</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    Live Session
                  </span>
                </div>

                <div className="text-center space-y-1.5 py-1">
                  <div className="text-sm font-bold text-foreground">How was your visit?</div>
                  <div className="text-xs text-muted-foreground">Tap stars to share feedback</div>
                  <div className="flex justify-center gap-1.5 pt-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-7 h-7 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center space-y-2">
                  <div className="text-xs font-bold text-amber-800">Delighted with your meal?</div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed">
                    Help other food lovers find us by sharing your experience on Google.
                  </div>
                  <div className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-zinc-900 text-white rounded-lg text-xs font-semibold">
                    <span>Post to Google Reviews</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* Right Mock: Business Moderation Inbox */}
              <div className="lg:col-span-7 bg-card rounded-2xl border border-border/80 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Live Customer Stream</h3>
                    <p className="text-xs text-muted-foreground">Real-time feedback captured across 18 tables</p>
                  </div>
                  <span className="text-xs font-semibold text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-lg">
                    4.8 ★ Avg
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Feedback Item 1 */}
                  <div className="p-3.5 rounded-xl border border-border/80 bg-background/50 hover:bg-background transition-colors flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          Routed to Google
                        </span>
                        <span className="text-[11px] text-muted-foreground">Table 4 • 8m ago</span>
                      </div>
                      <p className="text-xs text-foreground/90 font-medium">
                        &quot;Best ribeye in town! The staff was attentive and cocktails were spot on.&quot;
                      </p>
                    </div>
                  </div>

                  {/* Feedback Item 2 (Private Alert) */}
                  <div className="p-3.5 rounded-xl border border-amber-300/50 bg-amber-50/30 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <Star className="w-3.5 h-3.5 text-zinc-300" />
                          <Star className="w-3.5 h-3.5 text-zinc-300" />
                          <Star className="w-3.5 h-3.5 text-zinc-300" />
                        </div>
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-500/15 px-1.5 py-0.5 rounded">
                          Private Dashboard Only
                        </span>
                        <span className="text-[11px] text-muted-foreground">Patio 2 • 14m ago</span>
                      </div>
                      <p className="text-xs text-foreground/90 font-medium">
                        &quot;Soup arrived lukewarm and had to wait 20 minutes for the check.&quot;
                      </p>
                      <div className="pt-1 flex items-center gap-2">
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-card border border-border rounded text-muted-foreground">
                          Service & Speed
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold cursor-pointer hover:underline">
                          ✓ Marked Resolved by Manager
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-center text-xs text-muted-foreground">
                  Prevented 1 negative review from going public today.
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 border-t border-border/60 bg-muted/10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">How ReviewFlow Works</h2>
            <p className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              A frictionless loop designed to protect and promote your brand.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-card rounded-2xl border border-border/80 p-6 sm:p-7 shadow-2xs space-y-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center font-bold text-sm text-foreground">
                01
              </div>
              <h3 className="text-base font-bold text-foreground">Generate Branded QRs</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Create dedicated QR codes labeled by table, bar seat, or takeaway counter. Export print-ready PNG or SVG in seconds.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-card rounded-2xl border border-border/80 p-6 sm:p-7 shadow-2xs space-y-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center font-bold text-sm text-foreground">
                02
              </div>
              <h3 className="text-base font-bold text-foreground">Instant Guest Sentiment</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Guests scan with their phone camera. No mobile app download or registration required. Rating takes under 5 seconds.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-card rounded-2xl border border-border/80 p-6 sm:p-7 shadow-2xs space-y-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center font-bold text-sm text-foreground">
                03
              </div>
              <h3 className="text-base font-bold text-foreground">Intelligent Routing</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Happy guests are prompted to post directly to Google Reviews. Unhappy guests write to your private dashboard for immediate fixes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 border-t border-border/60 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Premium Capabilities</h2>
            <p className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Everything your venue needs to dominate local search rankings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card rounded-2xl border border-border/80 p-6 shadow-2xs space-y-3">
              <div className="p-2.5 rounded-xl bg-zinc-100 w-fit text-foreground">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Reputation Shield</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Intercept bad dining or service experiences before customers vent their frustration on public directories.
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-border/80 p-6 shadow-2xs space-y-3">
              <div className="p-2.5 rounded-xl bg-zinc-100 w-fit text-foreground">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Location Analytics</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Spot trends across different tables, shifts, and dates. Identify repeat complaints before they damage revenue.
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-border/80 p-6 shadow-2xs space-y-3">
              <div className="p-2.5 rounded-xl bg-zinc-100 w-fit text-foreground">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Unlimited QR Codes</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generate as many unique QR codes as you need for every table, bar stool, receipt, or hotel room.
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-border/80 p-6 shadow-2xs space-y-3">
              <div className="p-2.5 rounded-xl bg-zinc-100 w-fit text-foreground">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Customer Recovery</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Collect guest contact info for private complaints to issue apologies or vouchers and turn critics into regulars.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 border-t border-border/60 bg-muted/10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Transparent Pricing</h2>
            <p className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              One simple plan. All features included.
            </p>
            <p className="text-xs text-muted-foreground">
              No hidden add-ons. No per-scan charges. Cancel anytime with one click.
            </p>
          </div>

          <div className="max-w-md mx-auto bg-card rounded-3xl border border-border/80 shadow-lg p-7 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">ReviewFlow Pro</h3>
                <p className="text-xs text-muted-foreground">Full access for restaurants, clinics & stores</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                14-Day Free Trial
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 pb-4 border-b border-border/60">
              <span className="text-5xl font-bold tracking-tight text-foreground">299 грн</span>
              <span className="text-sm font-medium text-muted-foreground">/ month</span>
            </div>

            <ul className="space-y-3 text-xs text-foreground/90">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong>Unlimited</strong> QR codes & table locations</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong>Unlimited</strong> scans & customer feedback submissions</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Smart Google Reviews routing for 4–5★ ratings</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Private incident inbox with resolution tracking</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Analytics dashboard & sentiment breakdown</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>High-resolution print-ready PNG & SVG downloads</span>
              </li>
            </ul>

            <div className="pt-2">
              <Link
                href="/register"
                className="w-full py-3.5 px-4 bg-zinc-900 text-white text-center rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Start Your 14-Day Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-[11px] text-muted-foreground text-center mt-2.5">
                No credit card required. Setup takes less than 2 minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 border-t border-border/60 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Common Questions</h2>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Frequently asked questions
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-2">
              <h3 className="text-sm font-bold text-foreground">Is this compliant with Google&apos;s policies?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Yes. ReviewFlow does not gate or prohibit reviews. All customers have clear access to the direct review link, while giving unhappy customers an instant direct channel to management.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-2">
              <h3 className="text-sm font-bold text-foreground">Do customers have to install an app?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Never. They simply point their phone camera at the QR code, which opens a fast, lightweight mobile web page in their browser.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-2">
              <h3 className="text-sm font-bold text-foreground">How do I print the QR codes?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ReviewFlow generates high-resolution print-ready PNG codes. You can print them on acrylic table tents, stickers, wooden stands, or receipt slips.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-2">
              <h3 className="text-sm font-bold text-foreground">Can I change the Google Review link later?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Yes! Because all QR codes are dynamic, you can update your Google Review URL or business details in your dashboard anytime without reprinting your codes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 border-t border-border/60 bg-zinc-900 text-white px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Start protecting your reputation today.
          </h2>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto leading-relaxed">
            Join hundreds of hospitality, retail, and service businesses multiplying their 5-star Google reviews.
          </p>
          <div className="pt-2">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-all shadow-md"
            >
              <span>Start Free 14-Day Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-background py-8 px-4 sm:px-6 text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-zinc-900 text-white flex items-center justify-center font-bold text-[10px]">
              R
            </div>
            <span>© 2026 ReviewFlow. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
