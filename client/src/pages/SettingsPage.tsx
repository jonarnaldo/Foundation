import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { RefreshIcon, LinkIcon, TrashIcon, XIcon } from '../components/ui/Icons'

type Tab = 'account' | 'integrations' | 'notifications'

interface BankAccount {
  id: string
  institutionName: string
  accountName: string
  accountMask: string
  lastSyncedAt: string | null
  isActive: boolean
}

function PlaidSandboxModal({ onClose, onConnected }: { onClose: () => void; onConnected: (acct: BankAccount) => void }) {
  const [connecting, setConnecting] = useState(false)
  const [institutionName, setInstitutionName] = useState('First National Bank')
  const [accountName, setAccountName] = useState('Business Checking')

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const { linkToken } = await api.post<{ linkToken: string }>('/plaid/link-token', {})
      const result = await api.post<{ success: boolean; bankAccountId: string }>('/plaid/exchange-token', {
        publicToken: `public-sandbox-${linkToken}`,
        institutionName,
        accountName,
      })
      if (result.success) {
        const accounts = await api.get<BankAccount[]>('/bank-accounts')
        const created = accounts.find(a => a.id === result.bankAccountId)
        if (created) onConnected(created)
        onClose()
      }
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="plaid-modal-title">
      <div className="bg-white dark:bg-[#2A2A2A] rounded-xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-[#E5E5E5] dark:border-[#404040]">
          <h2 id="plaid-modal-title" className="font-semibold text-lg">Connect Bank Account</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#404040]" aria-label="Close">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            Sandbox mode — no real bank credentials required
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="inst-name">Institution Name</label>
            <input
              id="inst-name"
              className="w-full rounded-lg border border-[#E5E5E5] dark:border-[#404040] bg-white dark:bg-[#1A1A1A] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC785C]"
              value={institutionName}
              onChange={e => setInstitutionName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="acct-name">Account Name</label>
            <input
              id="acct-name"
              className="w-full rounded-lg border border-[#E5E5E5] dark:border-[#404040] bg-white dark:bg-[#1A1A1A] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC785C]"
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium border border-[#E5E5E5] dark:border-[#404040] rounded-lg hover:bg-gray-50 dark:hover:bg-[#404040] transition-colors">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting || !institutionName.trim()}
              className="flex-1 px-4 py-2 text-sm font-medium bg-[#CC785C] text-white rounded-lg hover:bg-[#B5674D] disabled:opacity-50 transition-colors"
              aria-label="Connect sandbox bank account"
            >
              {connecting ? 'Connecting…' : 'Connect (Sandbox)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('account')
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [syncing, setSyncing] = useState<string | null>(null)
  const [showPlaidModal, setShowPlaidModal] = useState(false)

  useEffect(() => {
    if (activeTab === 'integrations') {
      api.get<BankAccount[]>('/bank-accounts').then(setBankAccounts).catch(() => {})
    }
  }, [activeTab])

  const connectQuickBooks = async () => {
    const { url } = await api.post<{ url: string }>('/integrations/quickbooks/connect', {})
    window.open(url, '_blank', 'width=600,height=700')
  }

  const disconnectQuickBooks = async () => {
    await api.post('/integrations/quickbooks/disconnect', {})
  }

  const forceSync = async () => {
    await api.post('/integrations/quickbooks/sync', {})
  }

  const syncBank = async (id: string) => {
    setSyncing(id)
    await api.post(`/bank-accounts/${id}/sync`, {}).finally(() => setSyncing(null))
    setBankAccounts(prev => prev.map(a => a.id === id ? { ...a, lastSyncedAt: new Date().toISOString() } : a))
  }

  const removeBank = async (id: string) => {
    if (!confirm('Remove this bank account? Existing transactions will be retained.')) return
    await api.delete(`/bank-accounts/${id}`)
    setBankAccounts(prev => prev.filter(a => a.id !== id))
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'account', label: 'Account' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'notifications', label: 'Notifications' },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {/* Tab nav */}
      <div className="border-b border-[#E5E5E5] dark:border-[#404040]" role="tablist" aria-label="Settings sections">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-[#CC785C] text-[#CC785C]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Account tab */}
      {activeTab === 'account' && (
        <div id="panel-account" role="tabpanel" aria-labelledby="tab-account" className="space-y-4">
          <div className="card space-y-4">
            <h2 className="font-semibold">Profile</h2>
            <div>
              <label htmlFor="display-name" className="block text-sm font-medium mb-1">Display Name</label>
              <input id="display-name" className="input" placeholder="Your name" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
              <input id="email" className="input" type="email" placeholder="you@example.com" />
            </div>
            <button className="btn-primary text-sm">Save Account</button>
          </div>
        </div>
      )}

      {/* Integrations tab */}
      {activeTab === 'integrations' && (
        <div id="panel-integrations" role="tabpanel" aria-labelledby="tab-integrations" className="space-y-4">
          {/* QuickBooks */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">QuickBooks Online</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connect QuickBooks to auto-generate invoices and mark milestones as paid.
            </p>
            <div className="flex gap-3 flex-wrap">
              <button className="btn-primary text-sm flex items-center gap-2" onClick={connectQuickBooks}>
                <LinkIcon className="w-4 h-4" /> Connect QuickBooks
              </button>
              <button className="btn-secondary text-sm flex items-center gap-2" onClick={forceSync}>
                <RefreshIcon className="w-4 h-4" /> Force Sync
              </button>
              <button className="text-sm text-red-500 hover:text-red-700" onClick={disconnectQuickBooks}>
                Disconnect
              </button>
            </div>
          </div>

          {/* Bank accounts */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Bank Accounts</h2>
              <button className="btn-primary text-sm" onClick={() => setShowPlaidModal(true)} aria-label="Connect Bank Account">
                Connect Bank Account
              </button>
            </div>
            {bankAccounts.length === 0 ? (
              <p className="text-sm text-gray-500">No bank accounts connected yet.</p>
            ) : (
              <div className="space-y-2">
                {bankAccounts.map(acct => (
                  <div key={acct.id} className="flex items-center justify-between text-sm p-3 rounded-lg border border-[#E5E5E5] dark:border-[#404040]">
                    <div>
                      <p className="font-medium">{acct.institutionName} — {acct.accountName} ···{acct.accountMask}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Last synced: {acct.lastSyncedAt ? new Date(acct.lastSyncedAt).toLocaleString() : 'Never'}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => syncBank(acct.id)}
                        disabled={syncing === acct.id}
                        aria-label={`Sync ${acct.accountName}`}
                        title="Sync Now"
                      >
                        <RefreshIcon className={`w-4 h-4 ${syncing === acct.id ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 text-red-500 transition-colors"
                        onClick={() => removeBank(acct.id)}
                        aria-label={`Remove ${acct.accountName}`}
                        title="Remove"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications tab */}
      {activeTab === 'notifications' && (
        <div id="panel-notifications" role="tabpanel" aria-labelledby="tab-notifications" className="space-y-4">
          <div className="card space-y-4">
            <h2 className="font-semibold">Notification Preferences</h2>
            {[
              'Email alerts for un-invoiced approved milestones',
              'Email alerts for overdue client draws',
              'Email alerts for budget overruns',
              'Weekly portfolio summary email',
            ].map(label => (
              <label key={label} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded accent-[#CC785C]" defaultChecked />
                <span className="text-sm">{label}</span>
              </label>
            ))}
            <button className="btn-primary text-sm">Save Notifications</button>
          </div>
        </div>
      )}

      {showPlaidModal && (
        <PlaidSandboxModal
          onClose={() => setShowPlaidModal(false)}
          onConnected={acct => setBankAccounts(prev => [acct, ...prev])}
        />
      )}
    </div>
  )
}
