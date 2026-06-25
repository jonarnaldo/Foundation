import { Controller, Get, Post, Put, Delete, Patch, Body, Param, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PhasesService } from './phases.service'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'

@ApiTags('phases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PhasesController {
  constructor(private readonly svc: PhasesService) {}

  @Get('projects/:projectId/phases')
  findAll(@Param('projectId') projectId: string) {
    return this.svc.findAll(projectId)
  }

  @Post('projects/:projectId/phases')
  create(@Param('projectId') projectId: string, @Body() body: Record<string, unknown>) {
    return this.svc.create(projectId, body as never)
  }

  @Put('projects/:projectId/phases/:phaseId')
  update(@Param('phaseId') phaseId: string, @Body() body: Record<string, unknown>) {
    return this.svc.update(phaseId, body as never)
  }

  @Delete('projects/:projectId/phases/:phaseId')
  remove(@Param('phaseId') phaseId: string) {
    return this.svc.remove(phaseId)
  }

  @Patch('projects/:projectId/phases/reorder')
  reorder(@Param('projectId') projectId: string, @Body() body: { orderedIds: string[] }) {
    return this.svc.reorder(projectId, body.orderedIds)
  }
}
