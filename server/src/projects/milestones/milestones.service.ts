import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Milestone, MilestoneStatus, MilestoneColorBadge } from '../../database/entities/milestone.entity'
import { MilestoneCriterion } from '../../database/entities/milestone-criterion.entity'

const statusToBadge: Record<MilestoneStatus, MilestoneColorBadge> = {
  [MilestoneStatus.PENDING]: MilestoneColorBadge.GRAY,
  [MilestoneStatus.IN_PROGRESS]: MilestoneColorBadge.YELLOW,
  [MilestoneStatus.CRITERIA_MET]: MilestoneColorBadge.YELLOW,
  [MilestoneStatus.APPROVED]: MilestoneColorBadge.BLUE,
  [MilestoneStatus.INVOICED]: MilestoneColorBadge.BLUE,
  [MilestoneStatus.PAID]: MilestoneColorBadge.GREEN,
}

@Injectable()
export class MilestonesService {
  constructor(
    @InjectRepository(Milestone)
    private readonly repo: Repository<Milestone>,
    @InjectRepository(MilestoneCriterion)
    private readonly criteriaRepo: Repository<MilestoneCriterion>,
  ) {}

  findAllByStatus(status?: string) {
    const where = status ? { status: status as MilestoneStatus } : {}
    return this.repo.find({
      where,
      order: { sortOrder: 'ASC' },
      relations: ['phase'],
    })
  }

  findByPhase(phaseId: string) {
    return this.repo.find({
      where: { phaseId },
      order: { sortOrder: 'ASC' },
      relations: ['criteria', 'documents'],
    })
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id }, relations: ['criteria', 'documents'] })
  }

  async create(phaseId: string, dto: Partial<Milestone>) {
    const count = await this.repo.count({ where: { phaseId } })
    const milestone = this.repo.create({ ...dto, phaseId, sortOrder: count })
    return this.repo.save(milestone)
  }

  async update(id: string, dto: Partial<Milestone>) {
    await this.repo.update(id, { ...dto, colorBadge: dto.status ? statusToBadge[dto.status] : undefined })
    return this.findOne(id)
  }

  async remove(id: string) {
    const m = await this.findOne(id)
    if (!m) throw new NotFoundException('Milestone not found')
    return this.repo.remove(m)
  }

  async reorder(items: { milestoneId: string; phaseId: string; sortOrder: number }[]) {
    await Promise.all(
      items.map(({ milestoneId, phaseId, sortOrder }) =>
        this.repo.update(milestoneId, { phaseId, sortOrder }),
      ),
    )
  }

  async toggleReadyToInvoice(id: string, userId: string) {
    const milestone = await this.findOne(id)
    if (!milestone) throw new NotFoundException('Milestone not found')

    const nextInvoiceNumber = `INV-${Date.now().toString().slice(-6)}`
    await this.repo.update(id, {
      readyToInvoice: true,
      readyToInvoiceTriggeredAt: new Date(),
      readyToInvoiceTriggeredBy: userId,
      status: MilestoneStatus.INVOICED,
      colorBadge: MilestoneColorBadge.BLUE,
    })

    return { invoiceNumber: nextInvoiceNumber, amount: milestone.scheduledAmount }
  }

  // Criteria CRUD
  getCriteria(milestoneId: string) {
    return this.criteriaRepo.find({ where: { milestoneId }, order: { sortOrder: 'ASC' } })
  }

  addCriterion(milestoneId: string, dto: Partial<MilestoneCriterion>) {
    return this.criteriaRepo.save(this.criteriaRepo.create({ ...dto, milestoneId }))
  }

  async markCriterion(milestoneId: string, criterionId: string, userId: string, isMet: boolean) {
    await this.criteriaRepo.update(criterionId, {
      isMet,
      metAt: isMet ? new Date() : undefined,
      metBy: isMet ? userId : undefined,
    })
    await this.checkAllCriteriaMet(milestoneId)
    return this.criteriaRepo.findOne({ where: { id: criterionId } })
  }

  async removeCriterion(criterionId: string) {
    const c = await this.criteriaRepo.findOne({ where: { id: criterionId } })
    if (!c) throw new NotFoundException('Criterion not found')
    return this.criteriaRepo.remove(c)
  }

  private async checkAllCriteriaMet(milestoneId: string) {
    const criteria = await this.criteriaRepo.find({ where: { milestoneId } })
    if (criteria.length > 0 && criteria.every(c => c.isMet)) {
      await this.repo.update(milestoneId, {
        status: MilestoneStatus.CRITERIA_MET,
        colorBadge: MilestoneColorBadge.YELLOW,
      })
    }
  }
}
