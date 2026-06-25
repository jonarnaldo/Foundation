import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm'
import { ProjectPhase } from './project-phase.entity'

export enum CostCategory {
  LABOR = 'labor',
  MATERIALS = 'materials',
  SUBCONTRACTOR = 'subcontractor',
  EQUIPMENT = 'equipment',
  OVERHEAD = 'overhead',
  OTHER = 'other',
}

@Entity('phase_line_items')
export class PhaseLineItem {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  phaseId: string

  @ManyToOne(() => ProjectPhase, p => p.lineItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'phaseId' })
  phase: ProjectPhase

  @Column()
  name: string

  @Column({ nullable: true })
  description: string

  @Column({ default: 0 })
  sortOrder: number

  @Column({ type: 'decimal', precision: 12, scale: 4, default: 1 })
  quantity: number

  @Column({ nullable: true })
  unit: string

  @Column({ type: 'bigint', default: 0 })
  unitCost: number

  @Column({ type: 'bigint', default: 0, comment: 'computed: quantity * unitCost' })
  totalCost: number

  @Column({ type: 'enum', enum: CostCategory, default: CostCategory.OTHER })
  costCategory: CostCategory

  @Column({ nullable: true })
  quickbooksItemCode: string

  @Column({ nullable: true })
  notes: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
