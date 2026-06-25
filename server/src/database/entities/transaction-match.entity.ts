import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm'
import { BankTransaction } from './bank-transaction.entity'
import { Milestone } from './milestone.entity'

export enum MatchMethod {
  AUTO_AMOUNT = 'auto_amount',
  AUTO_OCR = 'auto_ocr',
  MANUAL_ONE_CLICK = 'manual_one_click',
  SPLIT_ALLOCATION = 'split_allocation',
}

export enum QBSyncStatus {
  PENDING = 'pending',
  SYNCED = 'synced',
  FAILED = 'failed',
}

@Entity('transaction_matches')
export class TransactionMatch {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  bankTransactionId: string

  @ManyToOne(() => BankTransaction, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bankTransactionId' })
  bankTransaction: BankTransaction

  @Column()
  milestoneId: string

  @ManyToOne(() => Milestone, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'milestoneId' })
  milestone: Milestone

  @Column({ type: 'bigint', default: 0 })
  matchedAmount: number

  @Column({ type: 'enum', enum: MatchMethod, default: MatchMethod.MANUAL_ONE_CLICK })
  matchMethod: MatchMethod

  @Column({ type: 'decimal', precision: 4, scale: 3, default: 0 })
  matchConfidenceScore: number

  @Column({ nullable: true })
  matchedBy: string

  @Column({ type: 'timestamp', nullable: true })
  matchedAt: Date

  @Column({ nullable: true })
  quickbooksInvoiceId: string

  @Column({ nullable: true })
  quickbooksPaymentId: string

  @Column({ type: 'enum', enum: QBSyncStatus, default: QBSyncStatus.PENDING })
  quickbooksSyncStatus: QBSyncStatus

  @Column({ type: 'timestamp', nullable: true })
  quickbooksSyncedAt: Date

  @Column({ nullable: true })
  notes: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
