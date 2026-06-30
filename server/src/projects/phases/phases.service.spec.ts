import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { PhasesService } from './phases.service'
import { ProjectPhase, PhaseStatus } from '../../database/entities/project-phase.entity'
import { Milestone, MilestoneStatus } from '../../database/entities/milestone.entity'

const makePhase = (overrides: Partial<ProjectPhase> = {}): ProjectPhase =>
  ({ id: 'phase-1', projectId: 'proj-1', name: 'Test Phase', sortOrder: 0, status: PhaseStatus.NOT_STARTED, completionPercentage: 0, milestones: [], ...overrides } as ProjectPhase)

const makeMilestone = (overrides: Partial<Milestone> = {}): Milestone =>
  ({ id: 'ms-1', phaseId: 'phase-1', name: 'Test MS', sortOrder: 0, status: MilestoneStatus.PENDING, scheduledAmount: 100000, ...overrides } as Milestone)

describe('PhasesService', () => {
  let service: PhasesService
  const phaseRepo = { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn(), count: jest.fn(), update: jest.fn(), remove: jest.fn() }
  const milestoneRepo = { find: jest.fn(), update: jest.fn() }

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhasesService,
        { provide: getRepositoryToken(ProjectPhase), useValue: phaseRepo },
        { provide: getRepositoryToken(Milestone), useValue: milestoneRepo },
      ],
    }).compile()
    service = module.get(PhasesService)
  })

  describe('findAll', () => {
    it('returns phases ordered by sortOrder', async () => {
      const phases = [makePhase({ sortOrder: 0, milestones: [] }), makePhase({ id: 'phase-2', sortOrder: 1, milestones: [] })]
      phaseRepo.find.mockResolvedValue(phases)
      const result = await service.findAll('proj-1')
      expect(result).toHaveLength(2)
      expect(phaseRepo.find).toHaveBeenCalledWith(expect.objectContaining({ order: { sortOrder: 'ASC' } }))
    })

    it('computes completionPercentage as 0 when no milestones', async () => {
      phaseRepo.find.mockResolvedValue([makePhase({ milestones: [] })])
      const [phase] = await service.findAll('proj-1')
      expect(phase.completionPercentage).toBe(0)
    })

    it('computes completionPercentage as 50% when 1 of 2 milestones is paid', async () => {
      const milestones = [
        makeMilestone({ id: 'ms-1', sortOrder: 0, status: MilestoneStatus.PAID }),
        makeMilestone({ id: 'ms-2', sortOrder: 1, status: MilestoneStatus.PENDING }),
      ]
      phaseRepo.find.mockResolvedValue([makePhase({ milestones })])
      const [phase] = await service.findAll('proj-1')
      expect(phase.completionPercentage).toBe(50)
    })

    it('computes completionPercentage as 100% when all milestones are paid', async () => {
      const milestones = [
        makeMilestone({ id: 'ms-1', sortOrder: 0, status: MilestoneStatus.PAID }),
        makeMilestone({ id: 'ms-2', sortOrder: 1, status: MilestoneStatus.PAID }),
      ]
      phaseRepo.find.mockResolvedValue([makePhase({ milestones })])
      const [phase] = await service.findAll('proj-1')
      expect(phase.completionPercentage).toBe(100)
    })

    it('sorts milestones by sortOrder within each phase', async () => {
      const milestones = [
        makeMilestone({ id: 'ms-2', sortOrder: 1 }),
        makeMilestone({ id: 'ms-1', sortOrder: 0 }),
      ]
      phaseRepo.find.mockResolvedValue([makePhase({ milestones })])
      const [phase] = await service.findAll('proj-1')
      expect(phase.milestones[0].id).toBe('ms-1')
      expect(phase.milestones[1].id).toBe('ms-2')
    })
  })

  describe('create', () => {
    it('assigns sortOrder based on existing phase count', async () => {
      phaseRepo.count.mockResolvedValue(3)
      const phase = makePhase({ sortOrder: 3 })
      phaseRepo.create.mockReturnValue(phase)
      phaseRepo.save.mockResolvedValue(phase)
      const result = await service.create('proj-1', { name: 'New Phase' })
      expect(phaseRepo.create).toHaveBeenCalledWith(expect.objectContaining({ sortOrder: 3, projectId: 'proj-1' }))
      expect(result.sortOrder).toBe(3)
    })
  })

  describe('remove', () => {
    it('throws NotFoundException when phase does not exist', async () => {
      phaseRepo.findOne.mockResolvedValue(null)
      await expect(service.remove('nonexistent')).rejects.toThrow('Phase not found')
    })

    it('removes the phase when found', async () => {
      const phase = makePhase()
      phaseRepo.findOne.mockResolvedValue(phase)
      phaseRepo.remove.mockResolvedValue(phase)
      await service.remove('phase-1')
      expect(phaseRepo.remove).toHaveBeenCalledWith(phase)
    })
  })

  describe('update', () => {
    it('calls update with the correct id and dto', async () => {
      const phase = makePhase({ name: 'Renamed Phase' })
      phaseRepo.update.mockResolvedValue({ affected: 1 })
      phaseRepo.findOne.mockResolvedValue(phase)
      const result = await service.update('phase-1', { name: 'Renamed Phase' })
      expect(phaseRepo.update).toHaveBeenCalledWith('phase-1', { name: 'Renamed Phase' })
      expect(result?.name).toBe('Renamed Phase')
    })
  })
})
