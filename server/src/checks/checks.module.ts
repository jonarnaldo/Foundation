import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PendingCheck } from '../database/entities/pending-check.entity'
import { Milestone } from '../database/entities/milestone.entity'
import { ChecksController } from './checks.controller'
import { ChecksService } from './checks.service'

@Module({
  imports: [TypeOrmModule.forFeature([PendingCheck, Milestone])],
  controllers: [ChecksController],
  providers: [ChecksService],
})
export class ChecksModule {}
