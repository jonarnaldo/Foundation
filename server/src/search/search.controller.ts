import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, ILike } from 'typeorm'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Project } from '../database/entities/project.entity'
import { BankTransaction } from '../database/entities/bank-transaction.entity'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'

@ApiTags('search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(BankTransaction)
    private readonly txRepo: Repository<BankTransaction>,
  ) {}

  @Get()
  async search(
    @Query('q') q: string,
    @Query('type') type?: string,
    @Req() req?: { user: { sub: string } },
  ) {
    if (!q?.trim()) return []

    const results: { id: string; type: string; label: string; sublabel?: string; href: string }[] = []

    if (!type || type === 'project') {
      const projects = await this.projectRepo.find({
        where: [
          { name: ILike(`%${q}%`), userId: req?.user?.sub },
          { clientName: ILike(`%${q}%`), userId: req?.user?.sub },
        ],
        take: 5,
      })
      results.push(...projects.map(p => ({
        id: p.id,
        type: 'project',
        label: p.name,
        sublabel: p.clientName,
        href: `/dashboard?project=${p.id}`,
      })))
    }

    if (!type || type === 'check') {
      const txs = await this.txRepo.find({
        where: [{ checkNumber: ILike(`%${q}%`) }, { description: ILike(`%${q}%`) }],
        take: 5,
      })
      results.push(...txs.map(tx => ({
        id: tx.id,
        type: 'check',
        label: tx.description,
        sublabel: tx.checkNumber ? `Check #${tx.checkNumber}` : undefined,
        href: `/bank-sync?transaction=${tx.id}`,
      })))
    }

    return results
  }
}
