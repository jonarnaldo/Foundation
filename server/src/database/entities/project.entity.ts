import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToMany, ManyToOne, JoinColumn,
} from 'typeorm'
import { ProjectPhase } from './project-phase.entity'

export enum ProjectStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  userId: string

  @Column()
  name: string

  @Column({ nullable: true })
  description: string

  @Column()
  clientName: string

  @Column({ nullable: true })
  clientEmail: string

  @Column({ nullable: true })
  clientPhone: string

  @Column({ type: 'bigint', default: 0 })
  contractValue: number

  @Column({ nullable: true })
  contractNumber: string

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.DRAFT })
  status: ProjectStatus

  @Column({ type: 'date', nullable: true })
  startDate: string

  @Column({ type: 'date', nullable: true })
  estimatedEndDate: string

  @Column({ type: 'date', nullable: true })
  actualEndDate: string

  @Column({ nullable: true })
  quickbooksCustomerId: string

  @OneToMany(() => ProjectPhase, phase => phase.project, { cascade: true })
  phases: ProjectPhase[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
