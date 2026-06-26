import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { api } from '../lib/api'

export interface Project {
  id: string
  name: string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  contractValue: number
  status: string
  description?: string
  startDate?: string
  estimatedEndDate?: string
  contractNumber?: string
}

interface ProjectContextValue {
  activeProjectId: string | null
  setActiveProjectId: (id: string | null) => void
  projects: Project[]
  setProjects: (projects: Project[]) => void
  isPortfolioView: boolean
  setIsPortfolioView: (v: boolean) => void
  refreshProjects: () => Promise<void>
  loading: boolean
  refreshVersion: number
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() =>
    localStorage.getItem('activeProjectId')
  )
  const [projects, setProjects] = useState<Project[]>([])
  const [isPortfolioView, setIsPortfolioView] = useState(false)
  const [loading, setLoading] = useState(true)
  const refreshVersionRef = useRef(0)
  const [refreshVersion, setRefreshVersion] = useState(0)

  const refreshProjects = useCallback(async () => {
    try {
      const data = await api.get<Project[]>('/projects')
      setProjects(data)
      if (data.length > 0) {
        const stored = localStorage.getItem('activeProjectId')
        const valid = stored && data.find(p => p.id === stored)
        if (!valid) {
          setActiveProjectId(data[0].id)
          localStorage.setItem('activeProjectId', data[0].id)
        }
      } else {
        setActiveProjectId(null)
        localStorage.removeItem('activeProjectId')
      }
    } catch {
      // ignore — backend may not be ready
    } finally {
      setLoading(false)
      refreshVersionRef.current += 1
      setRefreshVersion(refreshVersionRef.current)
    }
  }, [])

  useEffect(() => {
    refreshProjects()
  }, [refreshProjects])

  const handleSetActiveProjectId = (id: string | null) => {
    setActiveProjectId(id)
    if (id) localStorage.setItem('activeProjectId', id)
    else localStorage.removeItem('activeProjectId')
  }

  return (
    <ProjectContext.Provider
      value={{
        activeProjectId,
        setActiveProjectId: handleSetActiveProjectId,
        projects,
        setProjects,
        isPortfolioView,
        setIsPortfolioView,
        refreshProjects,
        loading,
        refreshVersion,
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject must be used inside ProjectProvider')
  return ctx
}
