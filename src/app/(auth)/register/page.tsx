import { register, signInWithGoogle } from '@/app/actions/auth'
import Link from 'next/link'
import { Check, Star, Sparkles, ArrowRight } from 'lucide-react'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const error = typeof resolvedParams.error === 'string' ? resolvedParams.error : null

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background antialiased">
      {/* Left Branding / Hero Column */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-zinc-950 text-white relative overflow-hidden border-r border-zinc-800/80">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-zinc-800/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-zinc-800/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white text-zinc-950 flex items-center justify-center font-extrabold text-xs shadow-sm">
              RF
            </div>
            <span className="text-base font-bold tracking-tight text-white">ReviewFlow</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md my-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>7-Day Full Feature Free Trial</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
            Start protecting your reputation in minutes.
          </h1>

          <p className="text-zinc-400 text-sm leading-relaxed">
            Create branded QR codes for your venue, collect authentic customer feedback, and automatically steer happy customers to post Google Reviews.
          </p>

          <div className="space-y-3 pt-2">
            {[
              '7-day free trial with unlimited QR codes',
              'Zero contract, cancel anytime with 1 click',
              'Setup takes less than 2 minutes',
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-2.5 text-xs text-zinc-300">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-zinc-800/80">
          <div className="flex items-center gap-1 text-amber-400 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-current" />
            ))}
          </div>
          <p className="text-xs text-zinc-300 italic leading-relaxed">
            &ldquo;Setting up ReviewFlow was effortless. We printed the QR codes the same afternoon, and our reviews increased threefold.&rdquo;
          </p>
          <span className="text-[11px] text-zinc-500 block mt-1.5 font-medium">
            Verified Coffee Shop & Roastery Owner
          </span>
        </div>
      </div>

      {/* Right Form Column */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden text-center mb-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-bold text-xs">
                RF
              </div>
              <span className="text-base font-bold text-foreground">ReviewFlow</span>
            </Link>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Start your free trial</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-foreground hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs leading-relaxed">
              {error}
            </div>
          )}

          {/* Google OAuth */}
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Sign up with Google</span>
            </button>
          </form>

          <div className="relative flex items-center justify-center my-4">
            <div className="w-full border-t border-border" />
            <span className="bg-background px-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium absolute">
              Or sign up with email
            </span>
          </div>

          {/* Registration Form */}
          <form className="space-y-3.5" action={register}>
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-foreground mb-1">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-colors"
                placeholder="Alex Morgan"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-foreground mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-colors"
                placeholder="alex@restaurant.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-foreground mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-colors"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-foreground mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-colors"
                placeholder="Re-enter password"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 text-white font-semibold text-xs sm:text-sm hover:bg-zinc-800 transition-all shadow-xs flex items-center justify-center gap-1.5 pt-3"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <p className="text-[11px] text-muted-foreground text-center pt-2">
            No credit card required. 7 days free. By registering, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-foreground">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
