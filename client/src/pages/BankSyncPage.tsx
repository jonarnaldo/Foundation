import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/currency'
import { LinkIcon, EyeIcon, XIcon, AlertTriangleIcon } from '../components/ui/Icons'

interface Transaction {
  id: string
  description: string
  amount: number
  postedDate: string
  paymentChannel: string
  matchStatus: 'unmatched' | 'auto_matched' | 'manually_matched' | 'split_matched' | 'ignored'
  checkImageUrl?: string
  memo?: string
}

interface SuggestedMatch {
  milestoneId: string
  milestoneName: string
  phaseName: string
  scheduledAmount: number
  matchConfidenceScore: number
  rationale: string
}

export function BankSyncPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [suggestions, setSuggestions] = useState<SuggestedMatch[]>([])
  const [selectedMatch, setSelectedMatch] = useState<SuggestedMatch | null>(null)
  const [showSplitDrawer, setShowSplitDrawer] = useState(false)
  const [showAuditLog, setShowAuditLog] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Transaction[]>('/transactions?status=unmatched')
      .then(setTransactions)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedTx) { setSuggestions([]); return }
    api.get<SuggestedMatch[]>(`/transactions/${selectedTx.id}/suggested-matches`)
      .then(s => { setSuggestions(s); setSelectedMatch(null) })
      .catch(() => setSuggestions([]))
  }, [selectedTx])

  const confirmMatch = async () => {
    if (!selectedTx || !selectedMatch) return
    await api.post(`/transactions/${selectedTx.id}/match`, {
      milestoneId: selectedMatch.milestoneId,
      matchMethod: 'manual_one_click',
    })
    setTransactions(t => t.filter(x => x.id !== selectedTx.id))
    setSelectedTx(null)
    setSuggestions([])
  }

  const ignoreTx = async (tx: Transaction) => {
    await api.patch(`/transactions/${tx.id}/ignore`)
    setTransactions(t => t.filter(x => x.id !== tx.id))
    if (selectedTx?.id === tx.id) setSelectedTx(null)
  }

  const confidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400'
    if (score >= 0.5) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between flex-shrink-0">
        <h1 className="text-2xl font-semibold">Bank Sync</h1>
        <button
          className="text-sm underline text-gray-500 hover:text-gray-700"
          onClick={() => setShowAuditLog(true)}
          aria-label="View reconciliation audit log"
        >
          View Audit Log
        </button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left pane — Unmatched Bank Feed */}
        <section
          className="flex-1 card p-0 overflow-hidden flex flex-col"
          aria-label="Unmatched bank feed"
        >
          <div className="px-4 py-3 border-b border-[#E5E5E5] dark:border-[#404040]">
            <h2 className="font-semibold text-sm">Unlinked Transactions</h2>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[#E5E5E5] dark:divide-[#404040]">
            {loading && (
              <div className="space-y-2 p-4 animate-pulse">
                {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded" />)}
              </div>
            )}
            {!loading && transactions.length === 0 && (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                All transactions matched
              </div>
            )}
            {transactions.map(tx => (
              <button
                key={tx.id}
                className={`w-full text-left px-4 py-3 hover:bg-[#F5F5F5] dark:hover:bg-[#404040] transition-colors text-sm group ${
                  selectedTx?.id === tx.id ? 'bg-[#F5F5F5] dark:bg-[#404040] border-l-2 border-[#CC785C]' : ''
                }`}
                onClick={() => setSelectedTx(tx)}
                aria-pressed={selectedTx?.id === tx.id}
                aria-label={`Transaction: ${tx.description}, ${formatCurrency(tx.amount)}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{tx.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{tx.postedDate} · {tx.paymentChannel}</p>
                    {tx.memo && <p className="text-xs text-gray-400 truncate">{tx.memo}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold text-green-700 dark:text-green-400 text-base">
                      {formatCurrency(tx.amount)}
                    </span>
                    <button
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-500 transition-all"
                      onClick={e => { e.stopPropagation(); ignoreTx(tx) }}
                      aria-label={`Ignore transaction: ${tx.description}`}
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Right pane — AI Suggested Matches */}
        <section
          className="w-80 flex-shrink-0 card p-0 overflow-hidden flex flex-col"
          aria-label="AI suggested matches"
          aria-live="polite"
        >
          <div className="px-4 py-3 border-b border-[#E5E5E5] dark:border-[#404040]">
            <h2 className="font-semibold text-sm">Suggested Matches</h2>
            {selectedTx && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{selectedTx.description}</p>
            )}
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[#E5E5E5] dark:divide-[#404040]">
            {!selectedTx && (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm p-4 text-center">
                Select a transaction to see suggested matches
              </div>
            )}
            {selectedTx && suggestions.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm p-4 text-center gap-2">
                <AlertTriangleIcon className="w-5 h-5" />
                No matching milestones found
              </div>
            )}
            {suggestions.map(s => (
              <button
                key={s.milestoneId}
                className={`w-full text-left px-4 py-3 hover:bg-[#F5F5F5] dark:hover:bg-[#404040] transition-colors text-sm ${
                  selectedMatch?.milestoneId === s.milestoneId ? 'bg-[#F5F5F5] dark:bg-[#404040] border-l-2 border-[#CC785C]' : ''
                }`}
                onClick={() => setSelectedMatch(s)}
                aria-pressed={selectedMatch?.milestoneId === s.milestoneId}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{s.milestoneName}</p>
                    <p className="text-xs text-gray-500">{s.phaseName}</p>
                    <p className="text-xs text-gray-400 mt-1">{s.rationale}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`font-bold text-xs ${confidenceColor(s.matchConfidenceScore)}`}>
                      {Math.round(s.matchConfidenceScore * 100)}%
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">{formatCurrency(s.scheduledAmount)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Action buttons */}
          {selectedTx && (
            <div className="p-3 border-t border-[#E5E5E5] dark:border-[#404040] space-y-2">
              <button
                className="btn-primary w-full text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                disabled={!selectedMatch}
                onClick={confirmMatch}
                aria-label="Link and sync selected match"
              >
                <LinkIcon className="w-4 h-4" /> Link & Sync
              </button>
              <button
                className="btn-secondary w-full text-sm"
                onClick={() => setShowSplitDrawer(true)}
                aria-label="Open split payment utility"
              >
                Split Payment
              </button>
              <button
                className="w-full text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1"
                onClick={() => {}}
                aria-label="View transaction details"
              >
                <EyeIcon className="w-3 h-3" /> View Details
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Split-Payment Utility Drawer */}
      {showSplitDrawer && selectedTx && (
        <SplitPaymentDrawer
          transaction={selectedTx}
          onClose={() => setShowSplitDrawer(false)}
          onConfirm={() => {
            setShowSplitDrawer(false)
            setTransactions(t => t.filter(x => x.id !== selectedTx.id))
            setSelectedTx(null)
          }}
        />
      )}

      {/* Audit Log Modal */}
      {showAuditLog && (
        <AuditLogModal onClose={() => setShowAuditLog(false)} />
      )}
    </div>
  )
}

interface SplitPaymentDrawerProps {
  transaction: Transaction
  onClose: () => void
  onConfirm: () => void
}

interface Milestone { id: string; name: string; phaseName: string; scheduledAmount: number }
interface Allocation { milestoneId: string; milestoneName: string; amount: string }

function SplitPaymentDrawer({ transaction, onClose, onConfirm }: SplitPaymentDrawerProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [allocations, setAllocations] = useState<Allocation[]>([])

  useEffect(() => {
    api.get<Milestone[]>('/milestones?status=approved')
      .then(setMilestones)
      .catch(() => {})
  }, [])

  const allocated = allocations.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0)
  const remaining = transaction.amount / 100 - allocated
  const canConfirm = Math.abs(remaining) < 0.01 && allocations.length > 0

  const addAllocation = (m: Milestone) => {
    if (allocations.find(a => a.milestoneId === m.id)) return
    setAllocations(prev => [...prev, { milestoneId: m.id, milestoneName: m.name, amount: '' }])
  }

  const confirmSplit = async () => {
    const payload = allocations.map(a => ({
      milestoneId: a.milestoneId,
      allocatedAmount: Math.round(parseFloat(a.amount) * 100),
    }))
    await api.post(`/transactions/${transaction.id}/split`, { allocations: payload })
    onConfirm()
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Split payment utility">
      <div className="flex-1 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="w-96 bg-white dark:bg-[#2A2A2A] border-l border-[#E5E5E5] dark:border-[#404040] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-[#E5E5E5] dark:border-[#404040]">
          <h2 className="font-semibold">Split Payment</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close drawer">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 bg-[#F5F5F5] dark:bg-[#1A1A1A] border-b border-[#E5E5E5] dark:border-[#404040]">
          <p className="text-sm text-gray-500">Total amount</p>
          <p className="text-xl font-bold text-green-700 dark:text-green-400">{formatCurrency(transaction.amount)}</p>
          <p className={`text-sm mt-1 ${remaining < 0 ? 'text-red-500' : remaining === 0 ? 'text-green-500' : 'text-gray-500'}`}>
            Remaining: ${remaining.toFixed(2)}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Milestone selector */}
          <div>
            <label htmlFor="split-milestone" className="block text-sm font-medium mb-1">Add Milestone</label>
            <select
              id="split-milestone"
              className="input text-sm"
              onChange={e => {
                const m = milestones.find(x => x.id === e.target.value)
                if (m) addAllocation(m)
                e.target.value = ''
              }}
              defaultValue=""
              aria-label="Select milestone to allocate"
            >
              <option value="" disabled>Select a milestone...</option>
              {milestones.map(m => (
                <option key={m.id} value={m.id} disabled={!!allocations.find(a => a.milestoneId === m.id)}>
                  {m.name} — {formatCurrency(m.scheduledAmount)}
                </option>
              ))}
            </select>
          </div>

          {/* Allocation rows */}
          {allocations.map((alloc, i) => (
            <div key={alloc.milestoneId} className="flex items-center gap-2">
              <span className="flex-1 text-sm truncate">{alloc.milestoneName}</span>
              <input
                className="input w-28 text-sm"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={alloc.amount}
                onChange={e => setAllocations(prev => prev.map((a, j) => j === i ? { ...a, amount: e.target.value } : a))}
                aria-label={`Amount for ${alloc.milestoneName}`}
              />
              <button
                className="p-1 text-red-400 hover:text-red-600"
                onClick={() => setAllocations(prev => prev.filter((_, j) => j !== i))}
                aria-label={`Remove ${alloc.milestoneName}`}
              >
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-[#E5E5E5] dark:border-[#404040]">
          <button
            className="btn-primary w-full disabled:opacity-50"
            disabled={!canConfirm}
            onClick={confirmSplit}
            aria-label="Confirm split payment allocation"
          >
            Confirm Split
          </button>
        </div>
      </div>
    </div>
  )
}

interface AuditEntry {
  id: string
  action: string
  performedBy?: string
  createdAt: string
  notes?: string
}

function AuditLogModal({ onClose }: { onClose: () => void }) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  useEffect(() => {
    api.get<AuditEntry[]>('/reconciliation/audit-log')
      .then(setEntries)
      .catch(() => {})
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-labelledby="audit-title">
      <div className="card max-w-2xl w-full mx-4 shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 id="audit-title" className="text-lg font-semibold">Reconciliation Audit Log</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {entries.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">No audit entries yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E5E5] dark:border-[#404040]">
                  <th className="text-left pb-2 font-semibold text-gray-500">Action</th>
                  <th className="text-left pb-2 font-semibold text-gray-500">Actor</th>
                  <th className="text-left pb-2 font-semibold text-gray-500">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5] dark:divide-[#404040]">
                {entries.map(e => (
                  <tr key={e.id}>
                    <td className="py-2 font-mono text-xs">{e.action}</td>
                    <td className="py-2 text-gray-600 dark:text-gray-400">{e.performedBy || 'System'}</td>
                    <td className="py-2 text-gray-500 text-xs">{new Date(e.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
