import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm'

export enum AuditAction {
  AUTO_MATCH_PROPOSED = 'auto_match_proposed',
  AUTO_MATCH_CONFIRMED = 'auto_match_confirmed',
  MANUALLY_MATCHED = 'manually_matched',
  MATCH_UNDONE = 'match_undone',
  SPLIT_CREATED = 'split_created',
  SPLIT_MODIFIED = 'split_modified',
  QUICKBOOKS_SYNCED = 'quickbooks_synced',
  QUICKBOOKS_SYNC_FAILED = 'quickbooks_sync_failed',
  TRANSACTION_IGNORED = 'transaction_ignored',
  TRANSACTION_UNIGNORED = 'transaction_unignored',
  OCR_PARSED = 'ocr_parsed',
}

@Entity('reconciliation_audit_log')
export class ReconciliationAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  bankTransactionId: string

  @Column({ nullable: true })
  transactionMatchId: string

  @Column({ nullable: true })
  performedBy: string

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction

  @Column({ type: 'jsonb', nullable: true })
  previousState: Record<string, unknown>

  @Column({ type: 'jsonb', nullable: true })
  newState: Record<string, unknown>

  @Column({ nullable: true })
  notes: string

  @CreateDateColumn()
  createdAt: Date
}
