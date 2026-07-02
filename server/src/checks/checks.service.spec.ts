import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { ChecksService } from './checks.service'
import { PendingCheck, PendingCheckStatus } from '../database/entities/pending-check.entity'
import { Milestone } from '../database/entities/milestone.entity'

const mockCheck = {
  id: 'check-1',
  projectId: 'proj-1',
  milestoneId: 'mile-1',
  checkNumber: '1042',
  amountCents: 150000,
  payorName: 'Acme Corp',
  memoLine: 'Phase 1 payment',
  status: PendingCheckStatus.PENDING,
  createdBy: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockMilestone = { id: 'mile-1', name: 'Foundation Pour' }

describe('ChecksService', () => {
  let service: ChecksService
  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  }
  const mockMilestoneRepo = {
    findOne: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChecksService,
        { provide: getRepositoryToken(PendingCheck), useValue: mockRepo },
        { provide: getRepositoryToken(Milestone), useValue: mockMilestoneRepo },
      ],
    }).compile()
    service = module.get<ChecksService>(ChecksService)
  })

  describe('create', () => {
    it('creates a check with status pending', async () => {
      mockMilestoneRepo.findOne.mockResolvedValue(mockMilestone)
      mockRepo.create.mockReturnValue(mockCheck)
      mockRepo.save.mockResolvedValue(mockCheck)

      const result = await service.create(
        { projectId: 'proj-1', milestoneId: 'mile-1', amountCents: 150000, payorName: 'Acme Corp' },
        'user-1',
      )
      expect(result.status).toBe(PendingCheckStatus.PENDING)
      expect(mockRepo.save).toHaveBeenCalled()
    })

    it('throws 400 for negative amountCents', async () => {
      await expect(
        service.create({ projectId: 'proj-1', milestoneId: 'mile-1', amountCents: -1, payorName: 'Acme' }, 'user-1'),
      ).rejects.toThrow(BadRequestException)
    })

    it('throws 404 for non-existent milestone', async () => {
      mockMilestoneRepo.findOne.mockResolvedValue(null)
      await expect(
        service.create({ projectId: 'proj-1', milestoneId: 'bad-id', amountCents: 1000, payorName: 'Acme' }, 'user-1'),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('findAll', () => {
    it('returns checks filtered by projectId', async () => {
      mockRepo.find.mockResolvedValue([mockCheck])
      const result = await service.findAll('proj-1')
      expect(mockRepo.find).toHaveBeenCalledWith(expect.objectContaining({ where: { projectId: 'proj-1' } }))
      expect(result).toHaveLength(1)
    })

    it('filters by status when provided', async () => {
      mockRepo.find.mockResolvedValue([mockCheck])
      await service.findAll('proj-1', 'pending')
      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { projectId: 'proj-1', status: 'pending' } }),
      )
    })
  })

  describe('findOne', () => {
    it('returns a check by id', async () => {
      mockRepo.findOne.mockResolvedValue(mockCheck)
      const result = await service.findOne('check-1')
      expect(result).toEqual(mockCheck)
    })

    it('throws 404 if not found', async () => {
      mockRepo.findOne.mockResolvedValue(null)
      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('updates a field and returns updated check', async () => {
      const updated = { ...mockCheck, memoLine: 'Updated memo' }
      mockRepo.findOne.mockResolvedValue(mockCheck).mockResolvedValueOnce(mockCheck).mockResolvedValueOnce(updated)
      mockRepo.update.mockResolvedValue({ affected: 1 })
      const result = await service.update('check-1', { memoLine: 'Updated memo' })
      expect(mockRepo.update).toHaveBeenCalledWith('check-1', { memoLine: 'Updated memo' })
    })
  })

  describe('remove', () => {
    it('removes a check and returns deletion confirmation', async () => {
      mockRepo.findOne.mockResolvedValue(mockCheck)
      mockRepo.remove.mockResolvedValue(mockCheck)
      const result = await service.remove('check-1')
      expect(result.deleted).toBe(true)
      expect(result.id).toBe('check-1')
    })
  })
})
