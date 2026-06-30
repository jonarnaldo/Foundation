import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../context/ProjectContext', () => ({
  useProject: () => ({
    activeProjectId: 'proj-1',
    projects: [{ id: 'proj-1', name: 'Harbor View' }],
  }),
}))

vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}))

import { ScheduleBuilderPage } from './ScheduleBuilderPage'
import { api } from '../lib/api'

const mockPhases = [
  {
    id: 'phase-1',
    name: 'Site Preparation',
    status: 'in_progress',
    completionPercentage: 50,
    colorCode: '#CC785C',
    milestones: [
      { id: 'ms-1', name: 'Site Clearing', scheduledAmount: 125000, status: 'paid', readyToInvoice: true, sortOrder: 0, completionPercentage: 0 },
      { id: 'ms-2', name: 'Grading', scheduledAmount: 125000, status: 'invoiced', readyToInvoice: false, sortOrder: 1, completionPercentage: 0 },
    ],
  },
  {
    id: 'phase-2',
    name: 'Foundation',
    status: 'not_started',
    completionPercentage: 0,
    colorCode: '#CC785C',
    milestones: [],
  },
]

describe('ScheduleBuilderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(api.get as ReturnType<typeof vi.fn>).mockResolvedValue(JSON.parse(JSON.stringify(mockPhases)))
  })

  it('loads and shows all phases expanded by default', async () => {
    render(<ScheduleBuilderPage />)
    await waitFor(() => expect(screen.getByText('Site Preparation')).toBeInTheDocument())
    expect(screen.getByText('Foundation')).toBeInTheDocument()
    const expanded = screen.getAllByRole('button', { expanded: true })
    expect(expanded.length).toBeGreaterThanOrEqual(2)
  })

  it('shows color-coded status badge for each phase', async () => {
    render(<ScheduleBuilderPage />)
    await waitFor(() => expect(screen.getByText('Site Preparation')).toBeInTheDocument())
    expect(screen.getByLabelText('Status: in progress')).toBeInTheDocument()
    expect(screen.getByLabelText('Status: not started')).toBeInTheDocument()
  })

  it('collapses a phase on header click and expands again', async () => {
    render(<ScheduleBuilderPage />)
    await waitFor(() => expect(screen.getByText('Site Clearing')).toBeInTheDocument())
    const firstHeader = screen.getAllByRole('button', { expanded: true })[0]
    fireEvent.click(firstHeader)
    expect(firstHeader).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(firstHeader)
    expect(firstHeader).toHaveAttribute('aria-expanded', 'true')
  })

  it('hides milestone rows when phase is collapsed', async () => {
    render(<ScheduleBuilderPage />)
    await waitFor(() => expect(screen.getByText('Site Clearing')).toBeInTheDocument())
    const firstHeader = screen.getAllByRole('button', { expanded: true })[0]
    fireEvent.click(firstHeader)
    expect(screen.queryByText('Site Clearing')).not.toBeInTheDocument()
  })

  it('shows completion percentage for each phase', async () => {
    render(<ScheduleBuilderPage />)
    await waitFor(() => expect(screen.getByText('Site Preparation')).toBeInTheDocument())
    expect(screen.getByText('50%')).toBeInTheDocument()
    const zeroPcts = screen.getAllByText('0%')
    expect(zeroPcts.length).toBeGreaterThanOrEqual(1)
  })

  it('shows the Add Phase modal when Add Phase button is clicked', async () => {
    render(<ScheduleBuilderPage />)
    await waitFor(() => expect(screen.getByLabelText('Add phase')).toBeInTheDocument())
    fireEvent.click(screen.getByLabelText('Add phase'))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
    expect(screen.getByLabelText(/Phase Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument()
  })

  it('submits Add Phase form and appends new phase to the list', async () => {
    const newPhase = { id: 'phase-3', name: 'Roofing', status: 'not_started', completionPercentage: 0, colorCode: '#CC785C', milestones: [] }
    ;(api.post as ReturnType<typeof vi.fn>).mockResolvedValue(newPhase)
    render(<ScheduleBuilderPage />)
    await waitFor(() => expect(screen.getByLabelText('Add phase')).toBeInTheDocument())

    fireEvent.click(screen.getByLabelText('Add phase'))
    await waitFor(() => expect(screen.getByLabelText(/Phase Name/i)).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText(/Phase Name/i), { target: { value: 'Roofing' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Phase' }))

    await waitFor(() => expect(screen.getByText('Roofing')).toBeInTheDocument())
    expect(api.post).toHaveBeenCalledWith('/projects/proj-1/phases', expect.objectContaining({ name: 'Roofing' }))
  })

  it('calls DELETE API and removes phase when delete button is clicked', async () => {
    ;(api.delete as ReturnType<typeof vi.fn>).mockResolvedValue({})
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<ScheduleBuilderPage />)
    await waitFor(() => expect(screen.getByText('Site Preparation')).toBeInTheDocument())

    fireEvent.click(screen.getByLabelText('Delete phase: Site Preparation'))

    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/projects/proj-1/phases/phase-1'))
    expect(screen.queryByText('Site Preparation')).not.toBeInTheDocument()
  })

  it('starts inline editing on phase name double-click', async () => {
    render(<ScheduleBuilderPage />)
    await waitFor(() => expect(screen.getByText('Site Preparation')).toBeInTheDocument())
    fireEvent.dblClick(screen.getByText('Site Preparation'))
    const input = screen.getByLabelText('Edit phase name')
    expect(input).toBeInTheDocument()
    expect((input as HTMLInputElement).value).toBe('Site Preparation')
  })

  it('saves inline edit on Enter keypress', async () => {
    ;(api.put as ReturnType<typeof vi.fn>).mockResolvedValue({})
    render(<ScheduleBuilderPage />)
    await waitFor(() => expect(screen.getByText('Site Preparation')).toBeInTheDocument())

    fireEvent.dblClick(screen.getByText('Site Preparation'))
    const input = screen.getByLabelText('Edit phase name')
    fireEvent.change(input, { target: { value: 'Phase 1: Site Prep' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => expect(api.put).toHaveBeenCalledWith(
      '/projects/proj-1/phases/phase-1',
      { name: 'Phase 1: Site Prep' },
    ))
    expect(screen.getByText('Phase 1: Site Prep')).toBeInTheDocument()
  })
})
