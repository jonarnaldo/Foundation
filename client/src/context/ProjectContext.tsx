import { createContext, useContext, useState } from 'react'

interface Project {
  id: string
  name: string
  clientName: string
  contractValue: number
  status: string
}

interface ProjectContextValue {
  activeProjectId: string | null
  setActiveProjectId: (id: string | null) => void
  projects: Project[]
  setProjects: (projects: Project[]) => void
  isPortfolioView: boolean
  setIsPortfolioView: (v: boolean) => void
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [isPortfolioView, setIsPortfolioView] = useState(false)

  return (
    <ProjectContext.Provider
      value={{
        activeProjectId,
        setActiveProjectId,
        projects,
        setProjects,
        isPortfolioView,
        setIsPortfolioView,
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
