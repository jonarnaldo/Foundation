import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config'
import { PendingCheck } from '../database/entities/pending-check.entity'
import { Milestone } from '../database/entities/milestone.entity'
import { ChecksController } from './checks.controller'
import { ChecksService } from './checks.service'
import { OcrService } from './ocr.service'

@Module({
  imports: [TypeOrmModule.forFeature([PendingCheck, Milestone]), ConfigModule],
  controllers: [ChecksController],
  providers: [ChecksService, OcrService],
})
export class ChecksModule {}
