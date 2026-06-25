import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { MilestonesService } from './milestones.service'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'

@ApiTags('milestones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class MilestonesController {
  constructor(private readonly svc: MilestonesService) {}

  @Get('phases/:phaseId/milestones')
  findByPhase(@Param('phaseId') phaseId: string) {
    return this.svc.findByPhase(phaseId)
  }

  @Post('phases/:phaseId/milestones')
  create(@Param('phaseId') phaseId: string, @Body() body: Record<string, unknown>) {
    return this.svc.create(phaseId, body as never)
  }

  @Get('milestones/:id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id)
  }

  @Put('milestones/:id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.svc.update(id, body as never)
  }

  @Delete('milestones/:id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id)
  }

  @Patch('milestones/reorder')
  reorder(@Body() body: { items: { milestoneId: string; phaseId: string; sortOrder: number }[] }) {
    return this.svc.reorder(body.items)
  }

  @Patch('milestones/:id/ready-to-invoice')
  toggleReadyToInvoice(@Param('id') id: string, @Req() req: { user: { sub: string } }) {
    return this.svc.toggleReadyToInvoice(id, req.user.sub)
  }

  // Criteria endpoints
  @Get('milestones/:milestoneId/criteria')
  getCriteria(@Param('milestoneId') milestoneId: string) {
    return this.svc.getCriteria(milestoneId)
  }

  @Post('milestones/:milestoneId/criteria')
  addCriterion(@Param('milestoneId') milestoneId: string, @Body() body: Record<string, unknown>) {
    return this.svc.addCriterion(milestoneId, body as never)
  }

  @Put('milestones/:milestoneId/criteria/:criterionId')
  markCriterion(
    @Param('milestoneId') milestoneId: string,
    @Param('criterionId') criterionId: string,
    @Req() req: { user: { sub: string } },
    @Body() body: { isMet: boolean },
  ) {
    return this.svc.markCriterion(milestoneId, criterionId, req.user.sub, body.isMet)
  }

  @Delete('milestones/:milestoneId/criteria/:criterionId')
  removeCriterion(@Param('criterionId') criterionId: string) {
    return this.svc.removeCriterion(criterionId)
  }
}
