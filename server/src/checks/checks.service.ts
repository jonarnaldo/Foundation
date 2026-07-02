import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PendingCheck, PendingCheckStatus } from '../database/entities/pending-check.entity'
import { Milestone } from '../database/entities/milestone.entity'

@Injectable()
export class ChecksService {
  constructor(
    @InjectRepository(PendingCheck)
    private readonly repo: Repository<PendingCheck>,
    @InjectRepository(Milestone)
    private readonly milestoneRepo: Repository<Milestone>,
  ) {}

  async create(dto: {
    projectId: string
    milestoneId: string
    checkNumber?: string
    amountCents: number
    payorName: string
    memoLine?: string
  }, userId: string) {
    if (dto.amountCents < 0) {
      throw new BadRequestException('amountCents must be a non-negative integer')
    }

    let milestone = null
    try {
      milestone = await this.milestoneRepo.findOne({ where: { id: dto.milestoneId } })
    } catch {
      // invalid UUID format treated as not found
    }
    if (!milestone) {
      throw new NotFoundException(`Milestone ${dto.milestoneId} not found`)
    }

    const check = this.repo.create({ ...dto, createdBy: userId })
    return this.repo.save(check)
  }

  findAll(projectId: string, status?: string) {
    const where: Record<string, unknown> = { projectId }
    if (status) where.status = status as PendingCheckStatus
    return this.repo.find({ where, order: { createdAt: 'DESC' } })
  }

  async findOne(id: string) {
    const check = await this.repo.findOne({ where: { id } })
    if (!check) throw new NotFoundException(`Check ${id} not found`)
    return check
  }

  async update(id: string, dto: Partial<PendingCheck>) {
    await this.findOne(id)
    await this.repo.update(id, dto)
    return this.findOne(id)
  }

  async remove(id: string) {
    const check = await this.findOne(id)
    await this.repo.remove(check)
    return { deleted: true, id }
  }
}
