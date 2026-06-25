import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm'
import { ProjectPhase } from './project-phase.entity'
import { MilestoneCriterion } from './milestone-criterion.entity'
import { MilestoneDocument } from './milestone-document.entity'

export enum MilestoneStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  CRITERIA_MET = 'criteria_met',
  APPROVED = 'approved',
  INVOICED = 'invoiced',
  PAID = 'paid',
}

export enum MilestoneColorBadge {
  GRAY = 'gray',
  YELLOW = 'yellow',
  BLUE = 'blue',
  GREEN = 'green',
  RED = 'red',
}

@Entity('milestones')
export class Milestone {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  phaseId: string

  @ManyToOne(() => ProjectPhase, p => p.milestones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'phaseId' })
  phase: ProjectPhase

  @Column()
  name: string

  @Column({ nullable: true })
  description: string

  @Column({ default: 0 })
  sortOrder: number

  @Column({ nullable: true })
  triggerDefinition: string

  @Column({ type: 'enum', enum: MilestoneStatus, default: MilestoneStatus.PENDING })
  status: MilestoneStatus

  @Column({ type: 'enum', enum: MilestoneColorBadge, default: MilestoneColorBadge.GRAY })
  colorBadge: MilestoneColorBadge

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  completionPercentage: number

  @Column({ type: 'bigint', default: 0 })
  scheduledAmount: number

  @Column({ default: false })
  readyToInvoice: boolean

  @Column({ type: 'timestamp', nullable: true })
  readyToInvoiceTriggeredAt: Date

  @Column({ nullable: true })
  readyToInvoiceTriggeredBy: string

  @Column({ nullable: true })
  quickbooksItemCode: string

  @Column({ nullable: true })
  quickbooksInvoiceId: string

  @Column({ type: 'date', nullable: true })
  dueDate: string

  @OneToMany(() => MilestoneCriterion, c => c.milestone, { cascade: true })
  criteria: MilestoneCriterion[]

  @OneToMany(() => MilestoneDocument, d => d.milestone, { cascade: true })
  documents: MilestoneDocument[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
