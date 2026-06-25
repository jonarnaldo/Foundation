import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AuthUser {
  sub: string
  email: string
  name: string
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ requiresMfa: boolean; mfaToken?: string }>
  verifyMfa: (mfaToken: string, code: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'foundation_auth_token'
const USER_KEY = 'foundation_auth_user'

function parseStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(parseStoredUser)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Validate stored token on mount
    const token = localStorage.getItem(TOKEN_KEY)
    const storedUser = parseStoredUser()
    if (token && storedUser) {
      setUser(storedUser)
    } else {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      setUser(null)
    }
  }, [])

  async function login(email: string, password: string) {
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Login failed' }))
        throw new Error((err as { message: string }).message || 'Invalid email or password')
      }
      const data = await res.json() as { requiresMfa: boolean; mfaToken?: string }
      return data
    } finally {
      setIsLoading(false)
    }
  }

  async function verifyMfa(mfaToken: string, code: string) {
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfaToken, code }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Verification failed' }))
        throw new Error((err as { message: string }).message || 'Invalid MFA code')
      }
      const data = await res.json() as { accessToken: string; user: AuthUser }
      localStorage.setItem(TOKEN_KEY, data.accessToken)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      setUser(data.user)
    } finally {
      setIsLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, verifyMfa, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
