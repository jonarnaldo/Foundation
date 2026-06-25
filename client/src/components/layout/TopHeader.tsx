import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { SearchIcon, SunIcon, MoonIcon } from '../ui/Icons'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'

interface QBStatus {
  status: 'connected' | 'needs-reauth' | 'disconnected'
}

interface SearchResult {
  id: string
  type: 'project' | 'client' | 'check'
  label: string
  sublabel?: string
  href: string
}

export function TopHeader() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [qbStatus, setQbStatus] = useState<QBStatus['status']>('disconnected')
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.get<QBStatus>('/integrations/quickbooks/status')
      .then(d => setQbStatus(d.status))
      .catch(() => setQbStatus('disconnected'))
  }, [])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      try {
        const data = await api.get<SearchResult[]>(`/search?q=${encodeURIComponent(query)}`)
        setResults(data)
      } catch {
        setResults([])
      }
    }, 200)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setQuery(''); setResults([]) }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const qbColors: Record<string, string> = {
    connected: 'bg-green-500',
    'needs-reauth': 'bg-amber-400',
    disconnected: 'bg-gray-400',
  }

  const handleQBClick = async () => {
    if (qbStatus === 'needs-reauth') {
      const { url } = await api.post<{ url: string }>('/integrations/quickbooks/connect', {})
      window.open(url, '_blank', 'width=600,height=700')
    }
  }

  return (
    <header className="flex items-center gap-4 px-6 py-3 border-b border-[#E5E5E5] dark:border-[#404040] bg-white dark:bg-[#1A1A1A] flex-shrink-0">
      {/* Global search */}
      <div className="relative flex-1 max-w-xl" ref={searchRef}>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search projects, clients, check numbers..."
            className="input pl-10 text-sm"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Global search"
            aria-expanded={results.length > 0}
            aria-haspopup="listbox"
            role="combobox"
          />
        </div>
        {results.length > 0 && (
          <ul
            className="absolute top-full mt-1 left-0 right-0 z-50 bg-white dark:bg-[#2A2A2A] border border-[#E5E5E5] dark:border-[#404040] rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto"
            role="listbox"
            aria-label="Search results"
          >
            {results.map(r => (
              <li key={`${r.type}-${r.id}`} role="option">
                <button
                  className="w-full text-left px-4 py-2 hover:bg-[#F5F5F5] dark:hover:bg-[#404040] transition-colors text-sm"
                  onClick={() => { navigate(r.href); setQuery(''); setResults([]) }}
                >
                  <span className="font-medium">{r.label}</span>
                  {r.sublabel && <span className="ml-2 text-gray-500 text-xs">{r.sublabel}</span>}
                  <span className="ml-2 text-xs text-[#CC785C] capitalize">{r.type}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] transition-colors duration-200"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
      </button>

      {/* QuickBooks sync indicator */}
      <button
        onClick={handleQBClick}
        className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#404040] hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] transition-colors duration-200"
        aria-label={`QuickBooks: ${qbStatus}`}
        title={`QuickBooks ${qbStatus}${qbStatus === 'needs-reauth' ? ' — click to reconnect' : ''}`}
      >
        <span className={`w-2 h-2 rounded-full ${qbColors[qbStatus] || 'bg-gray-400'}`} aria-hidden="true" />
        <span className="hidden sm:inline">QuickBooks</span>
      </button>

      {/* User avatar + logout */}
      {user && (
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#404040] bg-white dark:bg-[#1A1A1A]"
            aria-label={`Signed in as ${user.name}`}
          >
            <span className="w-6 h-6 rounded-full bg-[#CC785C] text-white text-xs font-semibold flex items-center justify-center" aria-hidden="true">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">{user.name}</span>
          </div>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="text-sm px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#404040] hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] transition-colors duration-200 text-gray-600 dark:text-gray-400"
            aria-label="Sign out"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  )
}
