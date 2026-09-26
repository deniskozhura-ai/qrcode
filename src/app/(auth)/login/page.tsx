import { login, signInWithGoogle } from '@/app/actions/auth'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const error = typeof resolvedParams.error === 'string' ? resolvedParams.error : null

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-50">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-sm border border-zinc-200">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-zinc-900">
            Sign in to ReviewFlow
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-600">
            Or{' '}
            <Link href="/register" className="font-medium text-black hover:text-zinc-700">
              start your 7-day free trial
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <form action={signInWithGoogle} className="mt-4">
          <button
            type="submit"
            className="group relative flex w-full justify-center items-center gap-3 rounded-md bg-white border border-zinc-300 px-3 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              <path d="M1 1h22v22H1z" fill="none" />
            </svg>
            Sign in with Google
          </button>
        </form>

        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-zinc-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-2 text-sm text-zinc-500">Or continue with</span>
          </div>
        </div>

        <form className="mt-6 space-y-6" action={login}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email" name="email" type="email" autoComplete="email" required
                className="relative block w-full rounded-md border-0 py-2.5 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 px-3"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password" name="password" type="password" autoComplete="current-password" required
                className="relative block w-full rounded-md border-0 py-2.5 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 px-3"
                placeholder="Password"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-md bg-black px-3 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Sign in with Email
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
