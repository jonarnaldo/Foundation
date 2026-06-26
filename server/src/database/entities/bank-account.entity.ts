import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm'

@Entity('bank_accounts')
export class BankAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  userId: string

  @Column({ nullable: true })
  plaidItemId: string

  @Column({ nullable: true })
  plaidAccessToken: string

  @Column({ default: 'First National Bank' })
  institutionName: string

  @Column({ default: 'Checking' })
  accountName: string

  @Column({ default: 'checking' })
  accountType: string

  @Column({ default: '0000' })
  accountMask: string

  @Column({ type: 'timestamptz', nullable: true })
  lastSyncedAt: Date | null

  @Column({ default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
