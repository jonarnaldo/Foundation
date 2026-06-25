import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm'

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  TRANSFER = 'transfer',
  FEE = 'fee',
  OTHER = 'other',
}

export enum PaymentChannel {
  CHECK = 'check',
  ACH = 'ach',
  WIRE = 'wire',
  CARD = 'card',
  OTHER = 'other',
}

export enum MatchStatus {
  UNMATCHED = 'unmatched',
  AUTO_MATCHED = 'auto_matched',
  MANUALLY_MATCHED = 'manually_matched',
  SPLIT_MATCHED = 'split_matched',
  IGNORED = 'ignored',
}

@Entity('bank_transactions')
export class BankTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  bankAccountId: string

  @Column({ unique: true })
  plaidTransactionId: string

  @Column({ type: 'enum', enum: TransactionType, default: TransactionType.OTHER })
  transactionType: TransactionType

  @Column({ type: 'enum', enum: PaymentChannel, default: PaymentChannel.OTHER })
  paymentChannel: PaymentChannel

  @Column({ type: 'bigint', default: 0 })
  amount: number

  @Column({ default: 'USD' })
  currencyCode: string

  @Column({ type: 'date' })
  postedDate: string

  @Column({ type: 'date', nullable: true })
  authorizedDate: string

  @Column()
  description: string

  @Column({ nullable: true })
  memo: string

  @Column({ nullable: true })
  checkNumber: string

  @Column({ nullable: true })
  checkImageUrl: string

  @Column({ type: 'text', nullable: true })
  ocrParsedText: string

  @Column({ type: 'jsonb', nullable: true })
  ocrParsedKeywords: string[]

  @Column({ type: 'enum', enum: MatchStatus, default: MatchStatus.UNMATCHED })
  matchStatus: MatchStatus

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
