import { NavLink } from 'react-router-dom'
import { useProject } from '../../context/ProjectContext'
import { ChevronLeftIcon, ChevronRightIcon, BarChart2Icon, CalendarIcon, BuildingIcon, SettingsIcon } from '../ui/Icons'

interface SidebarProps {
  open: boolean
  onToggle: () => void
}

export function Sidebar({ open, onToggle }: SidebarProps) {
  const { projects, activeProjectId, setActiveProjectId, isPortfolioView, setIsPortfolioView } = useProject()

  const navItems = [
    { to: '/schedule', label: 'Schedule Builder', icon: <CalendarIcon /> },
    { to: '/dashboard', label: 'Finances', icon: <BarChart2Icon /> },
    { to: '/bank-sync', label: 'Bank Sync', icon: <BuildingIcon /> },
    { to: '/settings', label: 'Settings', icon: <SettingsIcon /> },
  ]

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
        {/* Project dropdown */}
        <div className="p-3 border-b border-[#E5E5E5] dark:border-[#404040]">
          {open && (
            <div className="mb-2">
              <label htmlFor="project-switcher" className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Project
              </label>
              <select
                id="project-switcher"
                className="mt-1 w-full input text-sm"
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
                <option value="portfolio">Portfolio View</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
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
          className="m-2 p-2 rounded-lg hover:bg-white dark:hover:bg-[#404040] transition-colors duration-200 flex items-center justify-center"
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
    </>
  )
}
