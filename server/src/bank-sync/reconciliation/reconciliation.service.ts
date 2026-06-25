import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BankTransaction, MatchStatus } from '../../database/entities/bank-transaction.entity'
import { TransactionMatch, MatchMethod, QBSyncStatus } from '../../database/entities/transaction-match.entity'
import { ReconciliationAuditLog, AuditAction } from '../../database/entities/reconciliation-audit-log.entity'
import { Milestone, MilestoneStatus, MilestoneColorBadge } from '../../database/entities/milestone.entity'

@Injectable()
export class ReconciliationService {
  constructor(
    @InjectRepository(BankTransaction)
    private readonly txRepo: Repository<BankTransaction>,
    @InjectRepository(TransactionMatch)
    private readonly matchRepo: Repository<TransactionMatch>,
    @InjectRepository(ReconciliationAuditLog)
    private readonly auditRepo: Repository<ReconciliationAuditLog>,
    @InjectRepository(Milestone)
    private readonly milestoneRepo: Repository<Milestone>,
  ) {}

  async confirmMatch(
    transactionId: string,
    milestoneId: string,
    matchMethod: MatchMethod,
    userId: string,
  ) {
    const tx = await this.txRepo.findOne({ where: { id: transactionId } })
    if (!tx) throw new NotFoundException('Transaction not found')

    const match = this.matchRepo.create({
      bankTransactionId: transactionId,
      milestoneId,
      matchedAmount: tx.amount,
      matchMethod,
      matchConfidenceScore: 1,
      matchedBy: userId,
      matchedAt: new Date(),
      quickbooksSyncStatus: QBSyncStatus.PENDING,
    })
    await this.matchRepo.save(match)

    await this.txRepo.update(transactionId, { matchStatus: MatchStatus.MANUALLY_MATCHED })
    await this.milestoneRepo.update(milestoneId, {
      status: MilestoneStatus.PAID,
      colorBadge: MilestoneColorBadge.GREEN,
    })

    await this.auditRepo.save(this.auditRepo.create({
      bankTransactionId: transactionId,
      transactionMatchId: match.id,
      performedBy: userId,
      action: AuditAction.MANUALLY_MATCHED,
      newState: { matchId: match.id, milestoneId, status: 'paid' },
    }))

    return match
  }

  async undoMatch(transactionId: string, userId: string) {
    const match = await this.matchRepo.findOne({ where: { bankTransactionId: transactionId } })
    if (!match) throw new NotFoundException('Match not found')

    const previousState = { milestoneId: match.milestoneId, matchId: match.id }
    await this.milestoneRepo.update(match.milestoneId, {
      status: MilestoneStatus.APPROVED,
      colorBadge: MilestoneColorBadge.BLUE,
    })
    await this.txRepo.update(transactionId, { matchStatus: MatchStatus.UNMATCHED })
    await this.matchRepo.remove(match)

    await this.auditRepo.save(this.auditRepo.create({
      bankTransactionId: transactionId,
      performedBy: userId,
      action: AuditAction.MATCH_UNDONE,
      previousState,
    }))

    return { success: true }
  }

  async createSplit(
    transactionId: string,
    allocations: { milestoneId: string; allocatedAmount: number }[],
    userId: string,
  ) {
    const tx = await this.txRepo.findOne({ where: { id: transactionId } })
    if (!tx) throw new NotFoundException('Transaction not found')

    const matches = await Promise.all(
      allocations.map(a =>
        this.matchRepo.save(
          this.matchRepo.create({
            bankTransactionId: transactionId,
            milestoneId: a.milestoneId,
            matchedAmount: a.allocatedAmount,
            matchMethod: MatchMethod.SPLIT_ALLOCATION,
            matchedBy: userId,
            matchedAt: new Date(),
            quickbooksSyncStatus: QBSyncStatus.PENDING,
          }),
        ),
      ),
    )

    await Promise.all(allocations.map(a =>
      this.milestoneRepo.update(a.milestoneId, {
        status: MilestoneStatus.PAID,
        colorBadge: MilestoneColorBadge.GREEN,
      }),
    ))

    await this.txRepo.update(transactionId, { matchStatus: MatchStatus.SPLIT_MATCHED })
    await this.auditRepo.save(this.auditRepo.create({
      bankTransactionId: transactionId,
      performedBy: userId,
      action: AuditAction.SPLIT_CREATED,
      newState: { allocationCount: allocations.length },
    }))

    return matches
  }

  getAuditLog(filters?: { projectId?: string; from?: string; to?: string }) {
    return this.auditRepo.find({ order: { createdAt: 'DESC' }, take: 200 })
  }

  getTransactionAuditLog(transactionId: string) {
    return this.auditRepo.find({ where: { bankTransactionId: transactionId }, order: { createdAt: 'DESC' } })
  }
}
