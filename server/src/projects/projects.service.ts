import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Project, ProjectStatus } from '../database/entities/project.entity'

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly repo: Repository<Project>,
  ) {}

  findAll(userId: string) {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } })
  }

  async findOne(id: string, userId: string) {
    const project = await this.repo.findOne({ where: { id, userId } })
    if (!project) throw new NotFoundException('Project not found')
    return project
  }

  create(userId: string, dto: Partial<Project>) {
    const project = this.repo.create({ ...dto, userId, status: ProjectStatus.ACTIVE })
    return this.repo.save(project)
  }

  async update(id: string, userId: string, dto: Partial<Project>) {
    await this.findOne(id, userId)
    await this.repo.update({ id, userId }, dto)
    return this.findOne(id, userId)
  }

  async remove(id: string, userId: string) {
    const project = await this.findOne(id, userId)
    return this.repo.remove(project)
  }

  async getSummary(id: string, userId: string) {
    const project = await this.repo.findOne({
      where: { id, userId },
      relations: ['phases'],
    })
    if (!project) throw new NotFoundException('Project not found')
    return {
      id: project.id,
      name: project.name,
      status: project.status,
      contractValue: project.contractValue,
      phaseCount: project.phases?.length ?? 0,
      lastActivity: project.updatedAt,
    }
  }
}
