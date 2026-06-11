'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { registerUser } from '@/app/actions/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await registerUser(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    // Auto sign-in after successful registration
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    await signIn('credentials', {
      email,
      password,
      callbackUrl: '/',
    })
  }

  return (
    <div className="min-h-screen bg-[#171717] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <Sparkles className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">YusAI</h1>
          <p className="text-gray-500 text-sm mt-1">Create your account</p>
        </div>

        {/* Register Card */}
        <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-white mb-2">Get started</h2>
          <p className="text-gray-500 text-sm mb-6">Create an account to continue</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Name</label>
              <input
                name="name"
                type="text"
                required
                placeholder="Your name"
                className="w-full px-3 py-2.5 rounded-lg bg-[#171717] border border-[#2a2a2a] text-gray-200 placeholder-gray-600 text-sm outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 rounded-lg bg-[#171717] border border-[#2a2a2a] text-gray-200 placeholder-gray-600 text-sm outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Password</label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2.5 rounded-lg bg-[#171717] border border-[#2a2a2a] text-gray-200 placeholder-gray-600 text-sm outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2a2a2a]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-[#1f1f1f] text-gray-600">or</span>
              </div>
            </div>

            <button
              onClick={() => signIn('google', { callbackUrl: '/' })}
              className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-medium text-sm transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign up with Google
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-[#2a2a2a] text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="text-emerald-500 hover:text-emerald-400 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
