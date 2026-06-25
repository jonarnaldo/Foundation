import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm'
import { Milestone } from './milestone.entity'

@Entity('milestone_criteria')
export class MilestoneCriterion {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  milestoneId: string

  @ManyToOne(() => Milestone, m => m.criteria, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'milestoneId' })
  milestone: Milestone

  @Column()
  description: string

  @Column({ default: false })
  isMet: boolean

  @Column({ type: 'timestamp', nullable: true })
  metAt: Date

  @Column({ nullable: true })
  metBy: string

  @Column({ default: 0 })
  sortOrder: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
