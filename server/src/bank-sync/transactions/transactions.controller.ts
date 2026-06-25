import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { TransactionsService } from './transactions.service'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly svc: TransactionsService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('accountId') accountId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.svc.findAll({ status, accountId, from, to })
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id)
  }

  @Patch(':id/ignore')
  ignore(@Param('id') id: string) {
    return this.svc.ignore(id)
  }

  @Patch(':id/unignore')
  unignore(@Param('id') id: string) {
    return this.svc.unignore(id)
  }

  @Get(':id/suggested-matches')
  getSuggestedMatches(@Param('id') id: string) {
    return this.svc.getSuggestedMatches(id)
  }
}
