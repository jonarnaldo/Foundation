import { Controller, Post, Delete, Get, Param, Body, Query, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { ReconciliationService } from './reconciliation.service'
import { MatchMethod } from '../../database/entities/transaction-match.entity'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'

@ApiTags('reconciliation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ReconciliationController {
  constructor(private readonly svc: ReconciliationService) {}

  @Post('transactions/:id/match')
  confirmMatch(
    @Param('id') id: string,
    @Body() body: { milestoneId: string; matchMethod: MatchMethod },
    @Req() req: { user: { sub: string } },
  ) {
    return this.svc.confirmMatch(id, body.milestoneId, body.matchMethod, req.user.sub)
  }

  @Delete('transactions/:id/match')
  undoMatch(@Param('id') id: string, @Req() req: { user: { sub: string } }) {
    return this.svc.undoMatch(id, req.user.sub)
  }

  @Post('transactions/:id/split')
  createSplit(
    @Param('id') id: string,
    @Body() body: { allocations: { milestoneId: string; allocatedAmount: number }[] },
    @Req() req: { user: { sub: string } },
  ) {
    return this.svc.createSplit(id, body.allocations, req.user.sub)
  }

  @Get('reconciliation/audit-log')
  getAuditLog(
    @Query('projectId') projectId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.svc.getAuditLog({ projectId, from, to })
  }

  @Get('transactions/:id/audit-log')
  getTransactionAuditLog(@Param('id') id: string) {
    return this.svc.getTransactionAuditLog(id)
  }
}
