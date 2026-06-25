import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BankTransaction, MatchStatus } from '../../database/entities/bank-transaction.entity'
import { Milestone, MilestoneStatus } from '../../database/entities/milestone.entity'

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(BankTransaction)
    private readonly txRepo: Repository<BankTransaction>,
    @InjectRepository(Milestone)
    private readonly milestoneRepo: Repository<Milestone>,
  ) {}

  findAll(filters: { status?: string; accountId?: string; from?: string; to?: string }) {
    const qb = this.txRepo.createQueryBuilder('tx').orderBy('tx.postedDate', 'DESC')
    if (filters.status) qb.andWhere('tx.matchStatus = :status', { status: filters.status })
    if (filters.accountId) qb.andWhere('tx.bankAccountId = :accountId', { accountId: filters.accountId })
    if (filters.from) qb.andWhere('tx.postedDate >= :from', { from: filters.from })
    if (filters.to) qb.andWhere('tx.postedDate <= :to', { to: filters.to })
    return qb.getMany()
  }

  async findOne(id: string) {
    const tx = await this.txRepo.findOne({ where: { id } })
    if (!tx) throw new NotFoundException('Transaction not found')
    return tx
  }

  async ignore(id: string) {
    await this.txRepo.update(id, { matchStatus: MatchStatus.IGNORED })
    return this.findOne(id)
  }

  async unignore(id: string) {
    await this.txRepo.update(id, { matchStatus: MatchStatus.UNMATCHED })
    return this.findOne(id)
  }

  async getSuggestedMatches(transactionId: string) {
    const tx = await this.findOne(transactionId)
    const milestones = await this.milestoneRepo.find({
      where: { status: MilestoneStatus.APPROVED },
      relations: ['phase'],
    })

    return milestones
      .map(m => {
        const amountDelta = Math.abs(Number(m.scheduledAmount) - tx.amount)
        const amountScore = Math.max(0, 1 - amountDelta / (tx.amount || 1))
        const keywords = tx.ocrParsedKeywords || []
        const ocrScore = keywords.length > 0 ? 0.3 : 0
        const score = Math.min(0.99, amountScore * 0.7 + ocrScore)
        return {
          milestoneId: m.id,
          milestoneName: m.name,
          phaseName: m.phase?.name ?? '',
          scheduledAmount: Number(m.scheduledAmount),
          matchConfidenceScore: score,
          rationale: `Amount match: ${(amountScore * 100).toFixed(0)}%${ocrScore > 0 ? ', OCR keyword hit' : ''}`,
        }
      })
      .sort((a, b) => b.matchConfidenceScore - a.matchConfidenceScore)
      .slice(0, 10)
  }
}
