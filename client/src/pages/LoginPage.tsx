import { useState, FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { login, verifyMfa, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from || '/dashboard'

  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaToken, setMfaToken] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  async function handleCredentials(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const result = await login(email, password)
      if (result.requiresMfa && result.mfaToken) {
        setMfaToken(result.mfaToken)
        setStep('mfa')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  async function handleMfa(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await verifyMfa(mfaToken, code)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
      setCode('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#CC785C] mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Foundation</h1>
          <p className="text-slate-400 text-sm mt-1">Construction Finance Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {step === 'credentials' ? (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Welcome back</h2>
                <p className="text-sm text-gray-500 mt-0.5">Sign in to continue to Foundation</p>
              </div>

              <form onSubmit={handleCredentials} noValidate>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CC785C] focus:border-transparent transition-colors"
                      placeholder="you@example.com"
                      aria-describedby={error ? 'login-error' : undefined}
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CC785C] focus:border-transparent transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && (
                  <p id="login-error" role="alert" className="mt-3 text-sm text-red-600">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className="mt-5 w-full bg-[#CC785C] text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-[#b5684e] focus:outline-none focus:ring-2 focus:ring-[#CC785C] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Signing in…' : 'Continue'}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-gray-400">
                Authentication powered by{' '}
                <span className="font-medium text-gray-500">Auth0</span>
              </p>
            </>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3h3m-3 3h3" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Verify your identity</h2>
                    <p className="text-sm text-gray-500">MFA — enter your 6-digit code</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Open your authenticator app and enter the code for <strong className="font-medium">{email}</strong>.
                </p>
              </div>

              <form onSubmit={handleMfa} noValidate>
                <div>
                  <label htmlFor="mfa-code" className="block text-sm font-medium text-gray-700 mb-1">
                    One-time code
                  </label>
                  <input
                    id="mfa-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    maxLength={6}
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-center tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-[#CC785C] focus:border-transparent transition-colors"
                    placeholder="000000"
                    aria-describedby={error ? 'mfa-error' : undefined}
                    autoFocus
                  />
                </div>

                {error && (
                  <p id="mfa-error" role="alert" className="mt-3 text-sm text-red-600">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || code.length !== 6}
                  className="mt-5 w-full bg-[#CC785C] text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-[#b5684e] focus:outline-none focus:ring-2 focus:ring-[#CC785C] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Verifying…' : 'Verify'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('credentials'); setError(''); setCode('') }}
                  className="mt-2 w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
                >
                  Back to sign in
                </button>
              </form>
            </>
          )}
        </div>

        {/* Dev mode notice */}
        {import.meta.env.DEV && (
          <p className="mt-4 text-center text-xs text-slate-500">
            Dev mode — use <code className="font-mono text-slate-400">dev@foundation.app</code> with any password and code <code className="font-mono text-slate-400">123456</code>
          </p>
        )}
      </div>
    </div>
  )
}
