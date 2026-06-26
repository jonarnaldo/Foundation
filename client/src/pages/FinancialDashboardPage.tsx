import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/currency'
import { useProject } from '../context/ProjectContext'
import { AlertTriangleIcon, DownloadIcon, CheckIcon, XIcon } from '../components/ui/Icons'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'

interface DashboardMetrics {
  totalContractValue: number
  invoicedToDate: number
  cashCollected: number
  unbilledProgress: number
  grossProfitMarginPct: number
}

interface Alert {
  id: string
  alertType: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  isDismissed: boolean
}

interface Snapshot {
  snapshotDate: string
  cashInPeriod: number
  cashOutPeriod: number
  totalCashCollected: number
  totalActualExpenses: number
}

interface ExportModalProps {
  projectId: string
  onClose: () => void
}

function ExportReportModal({ projectId, onClose }: ExportModalProps) {
  const [reportType, setReportType] = useState<'cash_flow' | 'milestone_summary' | 'portfolio'>('cash_flow')
  const [outputFormat, setOutputFormat] = useState<'pdf' | 'csv'>('pdf')
  const [recipientLabel, setRecipientLabel] = useState<'Lender' | 'Client' | 'Accountant'>('Lender')
  const [dateStart, setDateStart] = useState(() => new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10))
  const [dateEnd, setDateEnd] = useState(() => new Date().toISOString().slice(0, 10))
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenerating(true)
    try {
      const report = await api.post<{ id: string; fileUrl?: string }>(`/projects/${projectId}/reports`, {
        reportType, outputFormat, recipientLabel, dateRangeStart: dateStart, dateRangeEnd: dateEnd,
      })
      if (report.fileUrl) {
        window.open(report.fileUrl, '_blank')
      } else {
        window.open(`/api/reports/${report.id}/download`, '_blank')
      }
      onClose()
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-labelledby="export-modal-title">
      <div className="card max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 id="export-modal-title" className="text-lg font-semibold">Export Report</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label htmlFor="report-type" className="block text-sm font-medium mb-1">Report Type</label>
            <select id="report-type" className="input" value={reportType} onChange={e => setReportType(e.target.value as typeof reportType)}>
              <option value="cash_flow">Cash Flow</option>
              <option value="milestone_summary">Milestone Summary</option>
              <option value="portfolio">Portfolio Overview</option>
            </select>
          </div>
          <div>
            <label htmlFor="output-format" className="block text-sm font-medium mb-1">Format</label>
            <select id="output-format" className="input" value={outputFormat} onChange={e => setOutputFormat(e.target.value as typeof outputFormat)}>
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          <div>
            <label htmlFor="recipient-label" className="block text-sm font-medium mb-1">Recipient</label>
            <select id="recipient-label" className="input" value={recipientLabel} onChange={e => setRecipientLabel(e.target.value as typeof recipientLabel)}>
              <option value="Lender">Lender</option>
              <option value="Client">Client</option>
              <option value="Accountant">Accountant</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="date-start" className="block text-sm font-medium mb-1">From</label>
              <input id="date-start" type="date" className="input" value={dateStart} onChange={e => setDateStart(e.target.value)} />
            </div>
            <div>
              <label htmlFor="date-end" className="block text-sm font-medium mb-1">To</label>
              <input id="date-end" type="date" className="input" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" className="btn-secondary text-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary text-sm flex items-center gap-2" disabled={generating}>
              {generating ? 'Generating…' : <><DownloadIcon className="w-4 h-4" /> Generate Report</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const severityClasses: Record<string, string> = {
  info: 'border-blue-300 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200',
  warning: 'border-amber-300 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200',
  critical: 'border-red-400 bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200',
}

const statusBadgeConfig: Record<string, { label: string; className: string }> = {
  active:    { label: 'Active',     className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  on_hold:   { label: 'On Hold',   className: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  completed: { label: 'Completed', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
}

export function FinancialDashboardPage() {
  const { activeProjectId, isPortfolioView, refreshVersion, projects } = useProject()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [interval, setInterval_] = useState<'day' | 'week' | 'month'>('month')
  const [loading, setLoading] = useState(true)
  const [showExportModal, setShowExportModal] = useState(false)

  const activeProject = projects.find(p => p.id === activeProjectId)

  useEffect(() => {
    setLoading(true)
    const path = isPortfolioView
      ? '/dashboard/portfolio'
      : activeProjectId
        ? `/projects/${activeProjectId}/dashboard`
        : null

    if (!path) { setLoading(false); setMetrics(null); setAlerts([]); setSnapshots([]); return }

    Promise.all([
      api.get<DashboardMetrics>(path),
      activeProjectId
        ? api.get<Alert[]>(`/projects/${activeProjectId}/alerts`)
        : Promise.resolve([]),
      activeProjectId
        ? api.get<Snapshot[]>(`/projects/${activeProjectId}/snapshots?interval=${interval}`)
        : Promise.resolve([]),
    ])
      .then(([m, a, s]) => { setMetrics(m); setAlerts(a); setSnapshots(s) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [activeProjectId, isPortfolioView, interval, refreshVersion])

  const dismissAlert = async (id: string) => {
    await api.patch(`/alerts/${id}/dismiss`)
    setAlerts(a => a.filter(x => x.id !== id))
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-28 bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
        <div className="card h-72 bg-gray-100 dark:bg-gray-800" />
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Select a project to view the financial dashboard
      </div>
    )
  }

  const metricCards = [
    { label: 'Total Contract Value', value: metrics.totalContractValue, color: 'text-[#CC785C]' },
    { label: 'Invoiced to Date', value: metrics.invoicedToDate, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Cash Collected', value: metrics.cashCollected, color: 'text-green-600 dark:text-green-400' },
    { label: 'Unbilled Progress', value: metrics.unbilledProgress, color: 'text-amber-600 dark:text-amber-400' },
  ]

  const activeAlerts = alerts.filter(a => !a.isDismissed)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Financial Dashboard</h1>
          {activeProject && (() => {
            const cfg = statusBadgeConfig[activeProject.status] ?? { label: activeProject.status, className: 'bg-gray-100 text-gray-700' }
            return (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}
                aria-label={`Project status: ${cfg.label}`}
                data-testid="project-status-badge"
              >
                {cfg.label}
              </span>
            )
          })()}
        </div>
        <button
          className="btn-secondary text-sm flex items-center gap-2"
          onClick={() => setShowExportModal(true)}
          aria-label="Export report"
        >
          <DownloadIcon className="w-4 h-4" /> Export Report
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="region" aria-label="Financial metrics">
        {metricCards.map(card => (
          <div key={card.label} className="card">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{card.label}</p>
            <p className={`mt-2 text-2xl font-semibold ${card.color}`}>
              {formatCurrency(card.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Action-item banner */}
      {activeAlerts.length > 0 && (
        <div className="space-y-2" role="region" aria-label="Action items">
          {activeAlerts.map(alert => (
            <div
              key={alert.id}
              className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${severityClasses[alert.severity]}`}
              role="alert"
              aria-live="polite"
            >
              <AlertTriangleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span className="flex-1">{alert.message}</span>
              <button
                className="flex-shrink-0 underline text-xs"
                onClick={() => dismissAlert(alert.id)}
                aria-label={`Dismiss alert: ${alert.message}`}
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Cash Flow Burn-Down Chart */}
      <div className="card" role="region" aria-label="Cash flow chart">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Cash Flow</h2>
          <div className="flex gap-1" role="group" aria-label="Chart interval">
            {(['day', 'week', 'month'] as const).map(i => (
              <button
                key={i}
                onClick={() => setInterval_(i)}
                className={`px-3 py-1 text-xs rounded-md transition-colors duration-150 ${
                  interval === i
                    ? 'bg-[#CC785C] text-white'
                    : 'hover:bg-[#F5F5F5] dark:hover:bg-[#404040]'
                }`}
                aria-pressed={interval === i}
              >
                {i.charAt(0).toUpperCase() + i.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {snapshots.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            No data available for selected period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={snapshots} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
              <XAxis dataKey="snapshotDate" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => `$${(v / 100000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                labelStyle={{ fontWeight: 600 }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="totalCashCollected"
                name="Cumulative Income"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="totalActualExpenses"
                name="Cumulative Expenses"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
        <p className="mt-2 text-xs text-gray-500 text-right">
          Gross Margin: {metrics.grossProfitMarginPct?.toFixed(1) ?? '—'}%
        </p>
      </div>

      {/* Gross margin card */}
      {activeAlerts.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
          <CheckIcon className="w-4 h-4" aria-hidden="true" />
          No outstanding action items
        </div>
      )}

      {showExportModal && activeProjectId && (
        <ExportReportModal projectId={activeProjectId} onClose={() => setShowExportModal(false)} />
      )}
    </div>
  )
}
