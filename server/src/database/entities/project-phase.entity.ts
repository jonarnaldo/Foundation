import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm'
import { Project } from './project.entity'
import { Milestone } from './milestone.entity'
import { PhaseLineItem } from './phase-line-item.entity'

export enum PhaseStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Entity('project_phases')
export class ProjectPhase {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  projectId: string

  @ManyToOne(() => Project, p => p.phases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project

  @Column()
  name: string

  @Column({ nullable: true })
  description: string

  @Column({ default: 0 })
  sortOrder: number

  @Column({ type: 'enum', enum: PhaseStatus, default: PhaseStatus.NOT_STARTED })
  status: PhaseStatus

  @Column({ default: '#CC785C' })
  colorCode: string

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  completionPercentage: number

  @Column({ type: 'date', nullable: true })
  estimatedStartDate: string

  @Column({ type: 'date', nullable: true })
  estimatedEndDate: string

  @Column({ type: 'date', nullable: true })
  actualStartDate: string

  @Column({ type: 'date', nullable: true })
  actualEndDate: string

  @OneToMany(() => Milestone, m => m.phase, { cascade: true })
  milestones: Milestone[]

  @OneToMany(() => PhaseLineItem, li => li.phase, { cascade: true })
  lineItems: PhaseLineItem[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
