import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Project } from '../database/entities/project.entity'
import { ProjectPhase } from '../database/entities/project-phase.entity'
import { Milestone } from '../database/entities/milestone.entity'
import { MilestoneCriterion } from '../database/entities/milestone-criterion.entity'
import { MilestoneDocument } from '../database/entities/milestone-document.entity'
import { PhaseLineItem } from '../database/entities/phase-line-item.entity'
import { ProjectsController } from './projects.controller'
import { PhasesController } from './phases/phases.controller'
import { MilestonesController } from './milestones/milestones.controller'
import { ProjectsService } from './projects.service'
import { PhasesService } from './phases/phases.service'
import { MilestonesService } from './milestones/milestones.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project, ProjectPhase, Milestone, MilestoneCriterion, MilestoneDocument, PhaseLineItem,
    ]),
  ],
  controllers: [ProjectsController, PhasesController, MilestonesController],
  providers: [ProjectsService, PhasesService, MilestonesService],
  exports: [ProjectsService, PhasesService, MilestonesService],
})
export class ProjectsModule {}
