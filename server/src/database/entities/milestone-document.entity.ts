import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm'
import { Milestone } from './milestone.entity'

export enum DocumentFileType {
  PDF = 'pdf',
  JPG = 'jpg',
  PNG = 'png',
  HEIC = 'heic',
  OTHER = 'other',
}

export enum DocumentCategory {
  INSPECTION_REPORT = 'inspection_report',
  SITE_PHOTO = 'site_photo',
  CONTRACT = 'contract',
  PERMIT = 'permit',
  OTHER = 'other',
}

@Entity('milestone_documents')
export class MilestoneDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  milestoneId: string

  @ManyToOne(() => Milestone, m => m.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'milestoneId' })
  milestone: Milestone

  @Column()
  uploadedBy: string

  @Column()
  fileName: string

  @Column({ type: 'enum', enum: DocumentFileType, default: DocumentFileType.OTHER })
  fileType: DocumentFileType

  @Column()
  fileUrl: string

  @Column({ type: 'bigint', default: 0 })
  fileSizeBytes: number

  @Column({ type: 'enum', enum: DocumentCategory, default: DocumentCategory.OTHER })
  category: DocumentCategory

  @Column({ nullable: true })
  description: string

  @Column({ nullable: true })
  notes: string

  @CreateDateColumn()
  createdAt: Date
}
