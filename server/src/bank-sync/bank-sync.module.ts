import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BankAccount } from '../database/entities/bank-account.entity'
import { BankTransaction } from '../database/entities/bank-transaction.entity'
import { TransactionMatch } from '../database/entities/transaction-match.entity'
import { ReconciliationAuditLog } from '../database/entities/reconciliation-audit-log.entity'
import { Milestone } from '../database/entities/milestone.entity'
import { TransactionsController } from './transactions/transactions.controller'
import { TransactionsService } from './transactions/transactions.service'
import { ReconciliationController } from './reconciliation/reconciliation.controller'
import { ReconciliationService } from './reconciliation/reconciliation.service'
import { PlaidController } from './plaid/plaid.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([BankAccount, BankTransaction, TransactionMatch, ReconciliationAuditLog, Milestone]),
  ],
  controllers: [TransactionsController, ReconciliationController, PlaidController],
  providers: [TransactionsService, ReconciliationService],
})
export class BankSyncModule {}
