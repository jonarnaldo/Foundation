import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm'
import { Project } from './project.entity'
import { Milestone } from './milestone.entity'

export enum PendingCheckStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  NEEDS_REVIEW = 'needs_review',
}

@Entity('pending_checks')
export class PendingCheck {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  projectId: string

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project

  @Column()
  milestoneId: string

  @ManyToOne(() => Milestone, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'milestoneId' })
  milestone: Milestone

  @Column({ nullable: true })
  checkNumber: string

  @Column({ type: 'bigint' })
  amountCents: number

  @Column()
  payorName: string

  @Column({ nullable: true })
  memoLine: string

  @Column({ type: 'enum', enum: PendingCheckStatus, default: PendingCheckStatus.PENDING })
  status: PendingCheckStatus

  @Column({ nullable: true })
  plaidTransactionId: string

  @Column()
  createdBy: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
