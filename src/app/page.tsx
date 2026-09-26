import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans text-zinc-900">
      
      {/* Navbar */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="text-xl font-bold tracking-tight">ReviewFlow</div>
        <div className="flex gap-4 items-center">
          <Link href="/login" className="text-sm font-medium hover:text-zinc-600">Log in</Link>
          <Link href="/register" className="text-sm font-medium bg-black text-white px-4 py-2 rounded-full hover:bg-zinc-800 transition-colors">Start Free</Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 w-full flex-col items-center pt-24 pb-32 px-6 sm:px-12 text-center">
        <h1 className="max-w-4xl text-5xl sm:text-6xl font-bold tracking-tight text-black leading-[1.1] mb-6">
          Turn customer feedback into <span className="text-zinc-500">better experiences.</span>
        </h1>
        <p className="max-w-2xl text-xl leading-8 text-zinc-600 mb-10">
          Collect honest feedback with one simple QR code — and understand what your customers really think before they leave a negative public review.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link href="/register" className="px-8 py-4 bg-black text-white rounded-full font-medium text-lg hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl">
            Start Free Trial
          </Link>
          <a href="#how-it-works" className="px-8 py-4 bg-white border border-zinc-200 text-black rounded-full font-medium text-lg hover:bg-zinc-50 transition-all">
            See how it works
          </a>
        </div>

        {/* Pricing */}
        <div id="pricing" className="mt-20 w-full max-w-sm mx-auto bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm">
          <h3 className="text-2xl font-semibold mb-2">Simple Pricing</h3>
          <div className="flex items-baseline justify-center gap-1 mb-6">
            <span className="text-5xl font-bold tracking-tight">299 грн</span>
            <span className="text-zinc-500 font-medium">/month</span>
          </div>
          <ul className="text-left space-y-4 mb-8">
            <li className="flex items-center gap-3">
              <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <span>Everything included</span>
            </li>
            <li className="flex items-center gap-3">
              <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <span>Unlimited QR codes</span>
            </li>
            <li className="flex items-center gap-3">
              <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <span>Unlimited locations</span>
            </li>
            <li className="flex items-center gap-3">
              <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <span>No complicated plans</span>
            </li>
          </ul>
          <Link href="/register" className="block w-full py-3 px-4 bg-black text-white text-center rounded-xl font-medium hover:bg-zinc-800 transition-colors">
            Start Free
          </Link>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-12 border-t border-zinc-200 mt-20 flex justify-between items-center text-sm text-zinc-500">
        <div>© 2026 ReviewFlow. All rights reserved.</div>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-zinc-900">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-zinc-900">Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
}
