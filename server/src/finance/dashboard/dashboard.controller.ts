import { Controller, Get, Post, Patch, Param, Query, Body, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { DashboardService } from './dashboard.service'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class DashboardController {
  constructor(private readonly svc: DashboardService) {}

  @Get('dashboard/portfolio')
  getPortfolio(@Req() req: { user: { sub: string } }) {
    return this.svc.getPortfolioDashboard(req.user.sub)
  }

  @Get('projects/:projectId/dashboard')
  getProjectDashboard(@Param('projectId') projectId: string) {
    return this.svc.getProjectDashboard(projectId)
  }

  @Get('projects/:projectId/alerts')
  getAlerts(@Param('projectId') projectId: string) {
    return this.svc.getAlerts(projectId)
  }

  @Patch('alerts/:alertId/dismiss')
  dismissAlert(@Param('alertId') alertId: string) {
    return { id: alertId, isDismissed: true }
  }

  @Get('projects/:projectId/snapshots')
  getSnapshots(
    @Param('projectId') projectId: string,
    @Query('interval') interval: string = 'month',
  ) {
    return this.svc.getSnapshots(projectId, interval)
  }

  @Post('projects/:projectId/reports')
  generateReport(@Param('projectId') projectId: string, @Body() body: Record<string, unknown>) {
    const id = `report-${Date.now()}`
    return { id, fileUrl: `/api/reports/${id}/download`, ...body }
  }

  @Get('reports/:reportId/download')
  downloadReport(@Param('reportId') _reportId: string) {
    return { message: 'Report download endpoint — streaming implementation pending' }
  }
}
