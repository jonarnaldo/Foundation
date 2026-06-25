import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useProject, Project } from '../../context/ProjectContext'
import {
  ChevronLeftIcon, ChevronRightIcon, BarChart2Icon, CalendarIcon,
  BuildingIcon, SettingsIcon, PlusIcon, XIcon,
} from '../ui/Icons'
import { api } from '../../lib/api'

interface SidebarProps {
  open: boolean
  onToggle: () => void
}

interface NewProjectForm {
  name: string
  clientName: string
  clientEmail: string
  clientPhone: string
  contractValue: string
  contractNumber: string
  description: string
  startDate: string
  estimatedEndDate: string
}

function EditProjectModal({ project, onClose, onSaved }: { project: Project; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: project.name || '',
    clientName: project.clientName || '',
    clientEmail: project.clientEmail || '',
    clientPhone: project.clientPhone || '',
    contractValue: project.contractValue ? (project.contractValue / 100).toFixed(2) : '',
    contractNumber: project.contractNumber || '',
    description: project.description || '',
    startDate: project.startDate ? project.startDate.slice(0, 10) : '',
    estimatedEndDate: project.estimatedEndDate ? project.estimatedEndDate.slice(0, 10) : '',
    status: project.status || 'active',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const contractValueCents = Math.round(parseFloat(form.contractValue.replace(/[$,]/g, '')) * 100) || 0
      await api.put(`/projects/${project.id}`, {
        name: form.name,
        clientName: form.clientName,
        clientEmail: form.clientEmail || undefined,
        clientPhone: form.clientPhone || undefined,
        contractValue: contractValueCents,
        contractNumber: form.contractNumber || undefined,
        description: form.description || undefined,
        startDate: form.startDate || undefined,
        estimatedEndDate: form.estimatedEndDate || undefined,
        status: form.status,
      })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full rounded-lg border border-[#E5E5E5] dark:border-[#404040] bg-white dark:bg-[#1A1A1A] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC785C]"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="edit-project-title">
      <div className="bg-white dark:bg-[#2A2A2A] rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-[#E5E5E5] dark:border-[#404040]">
          <h2 id="edit-project-title" className="font-semibold text-lg">Edit Project</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#404040]" aria-label="Close"><XIcon className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1" htmlFor="edit-proj-name">Project Name *</label>
              <input id="edit-proj-name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1" htmlFor="edit-proj-client">Client Name *</label>
              <input id="edit-proj-client" required value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="edit-proj-email">Client Email</label>
              <input id="edit-proj-email" type="email" value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="edit-proj-phone">Client Phone</label>
              <input id="edit-proj-phone" type="tel" value={form.clientPhone} onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="edit-proj-value">Contract Value ($)</label>
              <input id="edit-proj-value" value={form.contractValue} onChange={e => setForm(f => ({ ...f, contractValue: e.target.value }))} className={inputClass} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="edit-proj-status">Status</label>
              <select id="edit-proj-status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputClass}>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="edit-proj-start">Start Date</label>
              <input id="edit-proj-start" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="edit-proj-end">Est. End Date</label>
              <input id="edit-proj-end" type="date" value={form.estimatedEndDate} onChange={e => setForm(f => ({ ...f, estimatedEndDate: e.target.value }))} className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1" htmlFor="edit-proj-desc">Description</label>
              <textarea id="edit-proj-desc" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={`${inputClass} resize-none`} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium border border-[#E5E5E5] dark:border-[#404040] rounded-lg hover:bg-gray-50 dark:hover:bg-[#404040] transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 text-sm font-medium bg-[#CC785C] text-white rounded-lg hover:bg-[#B5674D] disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function Sidebar({ open, onToggle }: SidebarProps) {
  const { projects, activeProjectId, setActiveProjectId, isPortfolioView, setIsPortfolioView, refreshProjects } = useProject()
  const navigate = useNavigate()
  const [showNewProject, setShowNewProject] = useState(false)
  const [showEditProject, setShowEditProject] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<NewProjectForm>({ name: '', clientName: '', clientEmail: '', clientPhone: '', contractValue: '', contractNumber: '', description: '', startDate: '', estimatedEndDate: '' })

  const navItems = [
    { to: '/schedule', label: 'Schedule Builder', icon: <CalendarIcon /> },
    { to: '/dashboard', label: 'Finances', icon: <BarChart2Icon /> },
    { to: '/bank-sync', label: 'Bank Sync', icon: <BuildingIcon /> },
    { to: '/settings', label: 'Settings', icon: <SettingsIcon /> },
  ]

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.clientName) return
    setSaving(true)
    try {
      const contractValueCents = Math.round(parseFloat(form.contractValue.replace(/[$,]/g, '')) * 100) || 0
      const project = await api.post<{ id: string }>('/projects', {
        name: form.name,
        clientName: form.clientName,
        clientEmail: form.clientEmail || undefined,
        clientPhone: form.clientPhone || undefined,
        contractValue: contractValueCents,
        contractNumber: form.contractNumber || undefined,
        description: form.description || undefined,
        startDate: form.startDate || undefined,
        estimatedEndDate: form.estimatedEndDate || undefined,
        status: 'active',
      })
      await refreshProjects()
      setActiveProjectId(project.id)
      setIsPortfolioView(false)
      setShowNewProject(false)
      setForm({ name: '', clientName: '', clientEmail: '', clientPhone: '', contractValue: '', contractNumber: '', description: '', startDate: '', estimatedEndDate: '' })
      navigate('/dashboard')
    } catch (err) {
      console.error('Failed to create project:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed md:relative z-30 md:z-auto h-full
          flex flex-col bg-[#F5F5F5] dark:bg-[#2A2A2A]
          border-r border-[#E5E5E5] dark:border-[#404040]
          transition-all duration-300
          ${open ? 'w-64 translate-x-0' : 'w-0 md:w-14 -translate-x-full md:translate-x-0'}
          overflow-hidden
        `}
        aria-label="Primary navigation"
      >
        {/* Logo / brand */}
        <div className="p-3 border-b border-[#E5E5E5] dark:border-[#404040] flex items-center gap-2">
          {open ? (
            <span className="font-bold text-[#CC785C] text-lg tracking-tight">Foundation</span>
          ) : (
            <span className="font-bold text-[#CC785C] text-lg">F</span>
          )}
        </div>

        {/* Project section */}
        <div className="p-3 border-b border-[#E5E5E5] dark:border-[#404040]">
          {open && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="project-switcher" className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Project
                </label>
                <button
                  onClick={() => setShowNewProject(true)}
                  className="p-1 rounded hover:bg-[#CC785C]/10 text-[#CC785C] transition-colors"
                  aria-label="New project"
                  title="New project"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-1 mt-1">
                <select
                  id="project-switcher"
                  className="flex-1 min-w-0 rounded-lg border border-[#E5E5E5] dark:border-[#404040] bg-white dark:bg-[#1A1A1A] text-sm px-3 py-2 text-[#1A1A1A] dark:text-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#CC785C]"
                  value={isPortfolioView ? 'portfolio' : (activeProjectId ?? '')}
                  onChange={e => {
                    if (e.target.value === 'portfolio') {
                      setIsPortfolioView(true)
                      setActiveProjectId(null)
                    } else {
                      setIsPortfolioView(false)
                      setActiveProjectId(e.target.value)
                    }
                  }}
                  aria-label="Switch project"
                >
                  <option value="">Select a project…</option>
                  <option value="portfolio">Portfolio View</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {activeProjectId && !isPortfolioView && (
                  <button
                    onClick={() => setShowEditProject(true)}
                    className="flex-shrink-0 px-2 py-1 rounded-lg border border-[#E5E5E5] dark:border-[#404040] hover:bg-[#CC785C]/10 text-[#CC785C] text-xs transition-colors"
                    aria-label="Edit project"
                    title="Edit project"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-2 space-y-1" aria-label="Main navigation">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                ${isActive
                  ? 'bg-[#CC785C] text-white'
                  : 'text-[#1A1A1A] dark:text-[#E5E5E5] hover:bg-white dark:hover:bg-[#404040]'
                }`
              }
              aria-label={!open ? item.label : undefined}
            >
              <span className="flex-shrink-0 w-5 h-5" aria-hidden="true">{item.icon}</span>
              {open && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className="m-2 p-2 rounded-lg hover:bg-white dark:hover:bg-[#404040] transition-colors duration-200 flex items-center justify-center text-gray-500"
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </button>
      </aside>

      {/* Mobile toggle button when closed */}
      {!open && (
        <button
          onClick={onToggle}
          className="fixed bottom-4 left-4 z-40 md:hidden p-3 bg-[#CC785C] text-white rounded-full shadow-lg"
          aria-label="Open navigation"
        >
          <ChevronRightIcon />
        </button>
      )}

      {/* Edit Project Modal */}
      {showEditProject && activeProjectId && (() => {
        const proj = projects.find(p => p.id === activeProjectId)
        return proj ? (
          <EditProjectModal
            project={proj}
            onClose={() => setShowEditProject(false)}
            onSaved={async () => {
              await refreshProjects()
              setShowEditProject(false)
            }}
          />
        ) : null
      })()}

      {/* New Project Modal */}
      {showNewProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-project-title"
        >
          <div className="bg-white dark:bg-[#2A2A2A] rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[#E5E5E5] dark:border-[#404040]">
              <h2 id="new-project-title" className="font-semibold text-lg">New Project</h2>
              <button
                onClick={() => setShowNewProject(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#404040] transition-colors"
                aria-label="Close"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1" htmlFor="proj-name">Project Name *</label>
                  <input id="proj-name" type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-lg border border-[#E5E5E5] dark:border-[#404040] bg-white dark:bg-[#1A1A1A] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC785C]" placeholder="Harbor View Condominiums" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1" htmlFor="proj-client">Client Name *</label>
                  <input id="proj-client" type="text" required value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                    className="w-full rounded-lg border border-[#E5E5E5] dark:border-[#404040] bg-white dark:bg-[#1A1A1A] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC785C]" placeholder="Pacific Coast Developers" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="proj-email">Client Email</label>
                  <input id="proj-email" type="email" value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))}
                    className="w-full rounded-lg border border-[#E5E5E5] dark:border-[#404040] bg-white dark:bg-[#1A1A1A] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC785C]" placeholder="contact@client.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="proj-phone">Client Phone</label>
                  <input id="proj-phone" type="tel" value={form.clientPhone} onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))}
                    className="w-full rounded-lg border border-[#E5E5E5] dark:border-[#404040] bg-white dark:bg-[#1A1A1A] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC785C]" placeholder="(555) 555-0100" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="proj-value">Contract Value</label>
                  <input id="proj-value" type="text" value={form.contractValue} onChange={e => setForm(f => ({ ...f, contractValue: e.target.value }))}
                    className="w-full rounded-lg border border-[#E5E5E5] dark:border-[#404040] bg-white dark:bg-[#1A1A1A] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC785C]" placeholder="$4,500,000" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="proj-contract-num">Contract #</label>
                  <input id="proj-contract-num" type="text" value={form.contractNumber} onChange={e => setForm(f => ({ ...f, contractNumber: e.target.value }))}
                    className="w-full rounded-lg border border-[#E5E5E5] dark:border-[#404040] bg-white dark:bg-[#1A1A1A] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC785C]" placeholder="CON-2026-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="proj-start">Start Date</label>
                  <input id="proj-start" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full rounded-lg border border-[#E5E5E5] dark:border-[#404040] bg-white dark:bg-[#1A1A1A] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC785C]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="proj-end">Est. End Date</label>
                  <input id="proj-end" type="date" value={form.estimatedEndDate} onChange={e => setForm(f => ({ ...f, estimatedEndDate: e.target.value }))}
                    className="w-full rounded-lg border border-[#E5E5E5] dark:border-[#404040] bg-white dark:bg-[#1A1A1A] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC785C]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1" htmlFor="proj-desc">Description</label>
                  <textarea id="proj-desc" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full rounded-lg border border-[#E5E5E5] dark:border-[#404040] bg-white dark:bg-[#1A1A1A] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC785C] resize-none" placeholder="Brief description of the project…" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNewProject(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium border border-[#E5E5E5] dark:border-[#404040] rounded-lg hover:bg-gray-50 dark:hover:bg-[#404040] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-[#CC785C] text-white rounded-lg hover:bg-[#B5674D] disabled:opacity-50 transition-colors">
                  {saving ? 'Creating…' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
