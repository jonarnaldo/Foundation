import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useProject } from '../context/ProjectContext'
import { formatCurrency } from '../lib/currency'
import { PlusIcon, ChevronDownIcon, ChevronUpIcon, GripVerticalIcon, CheckIcon, XIcon, FileTextIcon } from '../components/ui/Icons'

interface Milestone {
  id: string
  name: string
  scheduledAmount: number
  status: 'pending' | 'in_progress' | 'criteria_met' | 'approved' | 'invoiced' | 'paid'
  readyToInvoice: boolean
  completionPercentage: number
  sortOrder: number
}

interface Phase {
  id: string
  name: string
  status: 'not_started' | 'in_progress' | 'completed'
  completionPercentage: number
  colorCode: string
  milestones: Milestone[]
}

const statusBadgeClasses: Record<string, string> = {
  pending: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  criteria_met: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  invoiced: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

const statusLabel: Record<string, string> = {
  pending: 'Draft',
  in_progress: 'In Progress',
  criteria_met: 'Awaiting Inspection',
  approved: 'Approved',
  invoiced: 'Ready to Invoice',
  paid: 'Paid',
}

interface RTIModalProps {
  milestoneId: string
  milestoneName: string
  amount: number
  invoiceNumber: string
  onConfirm: () => void
  onCancel: () => void
}

function ReadyToInvoiceModal({ milestoneName, amount, invoiceNumber, onConfirm, onCancel }: RTIModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-labelledby="rti-title">
      <div className="card max-w-md w-full mx-4 shadow-xl">
        <h2 id="rti-title" className="text-lg font-semibold mb-2">Generate Invoice?</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          This will generate <strong>{invoiceNumber}</strong> in QuickBooks for{' '}
          <strong>{milestoneName}</strong> totaling <strong>{formatCurrency(amount)}</strong>.
        </p>
        <div className="flex gap-3 justify-end">
          <button className="btn-secondary text-sm" onClick={onCancel}>Cancel</button>
          <button className="btn-primary text-sm" onClick={onConfirm} autoFocus>Proceed</button>
        </div>
      </div>
    </div>
  )
}

interface AddMilestoneModalProps {
  phases: Phase[]
  onClose: () => void
  onSave: (phaseId: string, data: { name: string; scheduledAmount: number; triggerDefinition: string }) => void
}

function AddMilestoneModal({ phases, onClose, onSave }: AddMilestoneModalProps) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [phaseId, setPhaseId] = useState(phases[0]?.id ?? '')
  const [trigger, setTrigger] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phaseId) return
    onSave(phaseId, {
      name: name.trim(),
      scheduledAmount: Math.round(parseFloat(amount || '0') * 100),
      triggerDefinition: trigger.trim(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-labelledby="add-milestone-title">
      <div className="card max-w-lg w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 id="add-milestone-title" className="text-lg font-semibold">Add Milestone</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="ms-name" className="block text-sm font-medium mb-1">Milestone Title</label>
            <input id="ms-name" className="input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Passed Mechanical Inspection" />
          </div>
          <div>
            <label htmlFor="ms-phase" className="block text-sm font-medium mb-1">Phase</label>
            <select id="ms-phase" className="input" value={phaseId} onChange={e => setPhaseId(e.target.value)} required>
              {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="ms-amount" className="block text-sm font-medium mb-1">Draw Amount ($)</label>
            <input id="ms-amount" className="input" type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label htmlFor="ms-trigger" className="block text-sm font-medium mb-1">Trigger Definition</label>
            <input id="ms-trigger" className="input" value={trigger} onChange={e => setTrigger(e.target.value)} placeholder="e.g. Passed Mechanical Inspection" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" className="btn-secondary text-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary text-sm">Add Milestone</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddPhaseModal({ onClose, onSave }: { onClose: () => void; onSave: (data: { name: string; description: string; estimatedBudget: number }) => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), description: description.trim(), estimatedBudget: Math.round(parseFloat(budget || '0') * 100) })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-labelledby="add-phase-title">
      <div className="card max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 id="add-phase-title" className="text-lg font-semibold">Add Phase</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close"><XIcon className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="phase-name" className="block text-sm font-medium mb-1">Phase Name *</label>
            <input id="phase-name" className="input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Foundation" />
          </div>
          <div>
            <label htmlFor="phase-desc" className="block text-sm font-medium mb-1">Description</label>
            <input id="phase-desc" className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description" />
          </div>
          <div>
            <label htmlFor="phase-budget" className="block text-sm font-medium mb-1">Estimated Budget ($)</label>
            <input id="phase-budget" className="input" type="number" min="0" step="0.01" value={budget} onChange={e => setBudget(e.target.value)} placeholder="0.00" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" className="btn-secondary text-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary text-sm">Add Phase</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ScheduleBuilderPage() {
  const { activeProjectId, projects } = useProject()
  const activeProject = projects.find(p => p.id === activeProjectId)
  const [phases, setPhases] = useState<Phase[]>([])
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAddPhase, setShowAddPhase] = useState(false)
  const [rtiModal, setRtiModal] = useState<{ milestoneId: string; name: string; amount: number; invoiceNumber: string; phaseId: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null)
  const [editingPhaseName, setEditingPhaseName] = useState('')

  useEffect(() => {
    if (!activeProjectId) { setLoading(false); return }
    setLoading(true)
    api.get<Phase[]>(`/projects/${activeProjectId}/phases`)
      .then(data => {
        setPhases(data)
        setExpandedPhases(new Set(data.map(p => p.id)))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [activeProjectId])

  const togglePhase = (id: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleRTIToggle = async (milestone: Milestone, phase: Phase) => {
    if (milestone.readyToInvoice) return
    const { invoiceNumber } = await api.patch<{ invoiceNumber: string; amount: number }>(
      `/milestones/${milestone.id}/ready-to-invoice`
    )
    setRtiModal({
      milestoneId: milestone.id,
      name: milestone.name,
      amount: milestone.scheduledAmount,
      invoiceNumber,
      phaseId: phase.id,
    })
  }

  const confirmRTI = async () => {
    if (!rtiModal) return
    setPhases(prev => prev.map(p =>
      p.id === rtiModal.phaseId
        ? { ...p, milestones: p.milestones.map(m => m.id === rtiModal.milestoneId ? { ...m, readyToInvoice: true, status: 'invoiced' as const } : m) }
        : p
    ))
    setRtiModal(null)
  }

  const addMilestone = async (phaseId: string, data: { name: string; scheduledAmount: number; triggerDefinition: string }) => {
    const milestone = await api.post<Milestone>(`/phases/${phaseId}/milestones`, data)
    setPhases(prev => prev.map(p =>
      p.id === phaseId ? { ...p, milestones: [...p.milestones, milestone] } : p
    ))
    setShowAddModal(false)
  }

  const addPhase = async (data: { name: string; description: string; estimatedBudget: number }) => {
    if (!activeProjectId) return
    const phase = await api.post<Phase>(`/projects/${activeProjectId}/phases`, { ...data, milestones: [] })
    setPhases(prev => [...prev, { ...phase, milestones: [] }])
    setExpandedPhases(prev => new Set([...prev, phase.id]))
    setShowAddPhase(false)
  }

  const deletePhase = async (phaseId: string) => {
    if (!activeProjectId) return
    if (!confirm('Delete this phase and all its milestones? This cannot be undone.')) return
    await api.delete(`/projects/${activeProjectId}/phases/${phaseId}`)
    setPhases(prev => prev.filter(p => p.id !== phaseId))
  }

  const startEditPhaseName = (phase: Phase, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingPhaseId(phase.id)
    setEditingPhaseName(phase.name)
  }

  const saveEditPhaseName = async (phaseId: string) => {
    const name = editingPhaseName.trim()
    if (!name) { setEditingPhaseId(null); return }
    await api.put(`/projects/${activeProjectId}/phases/${phaseId}`, { name })
    setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, name } : p))
    setEditingPhaseId(null)
  }

  const handlePhaseNameKeyDown = (e: React.KeyboardEvent, phaseId: string) => {
    if (e.key === 'Enter') { e.preventDefault(); saveEditPhaseName(phaseId) }
    if (e.key === 'Escape') { setEditingPhaseId(null) }
  }

  if (!activeProjectId) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Select a project to view the schedule</div>
  }

  if (loading) {
    return <div className="space-y-4 animate-pulse">{[...Array(3)].map((_, i) => <div key={i} className="card h-24 bg-gray-100 dark:bg-gray-800" />)}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{activeProject ? activeProject.name : 'Project Schedule'}</h1>
        <div className="flex items-center gap-2">
          <button className="btn-secondary flex items-center gap-2 text-sm" onClick={() => setShowAddPhase(true)} aria-label="Add phase">
            <PlusIcon className="w-4 h-4" /> Add Phase
          </button>
          <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => setShowAddModal(true)} aria-label="Add milestone">
            <PlusIcon className="w-4 h-4" /> Add Milestone
          </button>
        </div>
      </div>

      {phases.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm gap-3">
          <p>No phases yet. Click &ldquo;Add Phase&rdquo; to get started.</p>
          <button className="btn-primary text-sm" onClick={() => setShowAddPhase(true)}>Add Phase</button>
        </div>
      )}

      {phases.map(phase => {
        const isExpanded = expandedPhases.has(phase.id)
        return (
          <div key={phase.id} className="card p-0 overflow-hidden">
            {/* Phase header */}
            <div className="flex items-center">
              <button
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#F5F5F5] dark:hover:bg-[#404040] transition-colors duration-150 text-left flex-1"
                onClick={() => togglePhase(phase.id)}
                aria-expanded={isExpanded}
                aria-controls={`phase-${phase.id}-milestones`}
              >
                <GripVerticalIcon className="w-4 h-4 text-gray-400 flex-shrink-0 cursor-grab" aria-hidden="true" />
                {editingPhaseId === phase.id ? (
                  <input
                    className="font-semibold flex-1 bg-transparent border-b border-[#CC785C] outline-none"
                    value={editingPhaseName}
                    onChange={e => setEditingPhaseName(e.target.value)}
                    onBlur={() => saveEditPhaseName(phase.id)}
                    onKeyDown={e => handlePhaseNameKeyDown(e, phase.id)}
                    onClick={e => e.stopPropagation()}
                    autoFocus
                    aria-label="Edit phase name"
                  />
                ) : (
                  <span
                    className="font-semibold flex-1 cursor-text"
                    onDoubleClick={e => startEditPhaseName(phase, e)}
                    title="Double-click to edit"
                  >{phase.name}</span>
                )}
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${phase.colorCode}22`, color: phase.colorCode }}
                  aria-label={`Status: ${phase.status.replace('_', ' ')}`}
                >
                  {phase.status.replace('_', ' ')}
                </span>
                <span className="text-xs text-gray-500 mr-2">{parseFloat(String(phase.completionPercentage)).toFixed(0)}%</span>
                {isExpanded ? <ChevronUpIcon className="w-4 h-4 text-gray-400" /> : <ChevronDownIcon className="w-4 h-4 text-gray-400" />}
              </button>
              <button
                className="px-3 py-3 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                onClick={(e) => { e.stopPropagation(); deletePhase(phase.id) }}
                aria-label={`Delete phase: ${phase.name}`}
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Milestones */}
            {isExpanded && (
              <div id={`phase-${phase.id}-milestones`} className="divide-y divide-[#E5E5E5] dark:divide-[#404040]">
                {phase.milestones.length === 0 && (
                  <p className="px-10 py-3 text-sm text-gray-400">No milestones in this phase yet</p>
                )}
                {phase.milestones.map(milestone => (
                  <div key={milestone.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#F5F5F5] dark:hover:bg-[#404040] transition-colors duration-150">
                    <GripVerticalIcon className="w-4 h-4 text-gray-300 flex-shrink-0 cursor-grab" aria-hidden="true" />
                    <span className="flex-1 font-medium text-sm">{milestone.name}</span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {formatCurrency(milestone.scheduledAmount)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadgeClasses[milestone.status]}`}>
                      {statusLabel[milestone.status]}
                    </span>
                    {/* Ready to Invoice toggle */}
                    <button
                      role="switch"
                      aria-checked={milestone.readyToInvoice}
                      aria-label={`Ready to invoice: ${milestone.name}`}
                      onClick={() => handleRTIToggle(milestone, phase)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#CC785C] ${
                        milestone.readyToInvoice ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
                          milestone.readyToInvoice ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    {/* Document dock */}
                    <button
                      className="p-1.5 rounded hover:bg-white dark:hover:bg-[#2A2A2A] transition-colors"
                      aria-label={`Documents for ${milestone.name}`}
                    >
                      <FileTextIcon className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Modals */}
      {showAddPhase && (
        <AddPhaseModal
          onClose={() => setShowAddPhase(false)}
          onSave={addPhase}
        />
      )}
      {showAddModal && (
        <AddMilestoneModal
          phases={phases}
          onClose={() => setShowAddModal(false)}
          onSave={addMilestone}
        />
      )}
      {rtiModal && (
        <ReadyToInvoiceModal
          milestoneId={rtiModal.milestoneId}
          milestoneName={rtiModal.name}
          amount={rtiModal.amount}
          invoiceNumber={rtiModal.invoiceNumber}
          onConfirm={confirmRTI}
          onCancel={() => setRtiModal(null)}
        />
      )}

      {/* Completion indicator */}
      {phases.length > 0 && (
        <div className="text-xs text-gray-400 flex items-center gap-1">
          <CheckIcon className="w-3 h-3" /> Changes auto-save on blur or drag-drop
        </div>
      )}
    </div>
  )
}
