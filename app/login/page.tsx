'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function CaptainLoginPage() {
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'email' | 'sent'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSendMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    // Check if this email belongs to a captain
    const { data: team } = await supabase
      .from('teams')
      .select('id')
      .eq('captain_email', email.toLowerCase())
      .single()

    if (!team) {
      setError('No team found for this email. Please contact the tournament organizer or check that you used the correct email.')
      setLoading(false)
      return
    }

    // Send magic link
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/captain/dashboard`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setStep('sent')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Captain Login</h1>
          <p className="mt-2 text-gray-600">
            {step === 'email'
              ? 'Enter your registered email address'
              : 'Check your email for the login link'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleSendMagicLink} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="captain@example.com"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use the email registered with your team
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Login Link'}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Check Your Email</h3>
              <p className="text-gray-600">
                We sent a login link to<br />
                <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-500">
                Click the link in the email to sign in. The link will expire in 1 hour.
              </p>
              <button
                onClick={() => {
                  setStep('email')
                  setError(null)
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Use a different email
              </button>
            </div>
          )}
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
