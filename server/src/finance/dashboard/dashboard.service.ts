import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Project } from '../../database/entities/project.entity'
import { Milestone, MilestoneStatus } from '../../database/entities/milestone.entity'

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Milestone)
    private readonly milestoneRepo: Repository<Milestone>,
  ) {}

  async getProjectDashboard(projectId: string) {
    const project = await this.projectRepo.findOne({ where: { id: projectId } })
    if (!project) return null

    const milestones = await this.milestoneRepo
      .createQueryBuilder('m')
      .innerJoin('m.phase', 'p')
      .where('p.projectId = :projectId', { projectId })
      .getMany()

    const invoicedToDate = milestones
      .filter(m => [MilestoneStatus.INVOICED, MilestoneStatus.PAID].includes(m.status))
      .reduce((s, m) => s + Number(m.scheduledAmount), 0)

    const cashCollected = milestones
      .filter(m => m.status === MilestoneStatus.PAID)
      .reduce((s, m) => s + Number(m.scheduledAmount), 0)

    const unbilledProgress = milestones
      .filter(m => m.status === MilestoneStatus.APPROVED)
      .reduce((s, m) => s + Number(m.scheduledAmount), 0)

    return {
      totalContractValue: Number(project.contractValue),
      invoicedToDate,
      cashCollected,
      unbilledProgress,
      grossProfitMarginPct: project.contractValue > 0
        ? (cashCollected / Number(project.contractValue)) * 100
        : 0,
    }
  }

  async getPortfolioDashboard(userId: string) {
    const projects = await this.projectRepo.find({ where: { userId } })
    const dashboards = await Promise.all(projects.map(p => this.getProjectDashboard(p.id)))

    return dashboards.reduce(
      (acc, d) => {
        if (!d) return acc
        return {
          totalContractValue: acc.totalContractValue + d.totalContractValue,
          invoicedToDate: acc.invoicedToDate + d.invoicedToDate,
          cashCollected: acc.cashCollected + d.cashCollected,
          unbilledProgress: acc.unbilledProgress + d.unbilledProgress,
          grossProfitMarginPct: 0,
        }
      },
      { totalContractValue: 0, invoicedToDate: 0, cashCollected: 0, unbilledProgress: 0, grossProfitMarginPct: 0 },
    )
  }

  getAlerts(projectId: string) {
    return []
  }

  getSnapshots(projectId: string, interval: string) {
    return []
  }
}
