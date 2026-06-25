import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Project } from '../database/entities/project.entity'
import { Milestone } from '../database/entities/milestone.entity'
import { DashboardController } from './dashboard/dashboard.controller'
import { DashboardService } from './dashboard/dashboard.service'

@Module({
  imports: [TypeOrmModule.forFeature([Project, Milestone])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class FinanceModule {}
