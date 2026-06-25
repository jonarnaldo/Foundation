import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProjectPhase } from '../../database/entities/project-phase.entity'
import { Milestone, MilestoneStatus } from '../../database/entities/milestone.entity'

@Injectable()
export class PhasesService {
  constructor(
    @InjectRepository(ProjectPhase)
    private readonly repo: Repository<ProjectPhase>,
    @InjectRepository(Milestone)
    private readonly milestoneRepo: Repository<Milestone>,
  ) {}

  async findAll(projectId: string) {
    const phases = await this.repo.find({
      where: { projectId },
      order: { sortOrder: 'ASC' },
      relations: ['milestones'],
    })
    return phases.map(p => ({
      ...p,
      milestones: (p.milestones || []).sort((a, b) => a.sortOrder - b.sortOrder),
    }))
  }

  async create(projectId: string, dto: Partial<ProjectPhase>) {
    const count = await this.repo.count({ where: { projectId } })
    const phase = this.repo.create({ ...dto, projectId, sortOrder: count })
    return this.repo.save(phase)
  }

  async update(id: string, dto: Partial<ProjectPhase>) {
    await this.repo.update(id, dto)
    return this.repo.findOne({ where: { id }, relations: ['milestones'] })
  }

  async remove(id: string) {
    const phase = await this.repo.findOne({ where: { id } })
    if (!phase) throw new NotFoundException('Phase not found')
    return this.repo.remove(phase)
  }

  async reorder(projectId: string, orderedIds: string[]) {
    await Promise.all(
      orderedIds.map((id, index) => this.repo.update({ id, projectId }, { sortOrder: index })),
    )
    return this.findAll(projectId)
  }

  async recalculateCompletion(phaseId: string) {
    const milestones = await this.milestoneRepo.find({ where: { phaseId } })
    if (milestones.length === 0) {
      await this.repo.update(phaseId, { completionPercentage: 0 })
      return
    }
    const paidCount = milestones.filter(m => m.status === MilestoneStatus.PAID).length
    const pct = (paidCount / milestones.length) * 100
    await this.repo.update(phaseId, { completionPercentage: pct })
  }
}
