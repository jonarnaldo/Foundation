import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'

@ApiTags('settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  @Get()
  getSettings() {
    return {
      notifications: {
        uninvoicedMilestoneEmail: true,
        overdueDrawEmail: true,
        budgetOverrunEmail: true,
        weeklyPortfolioSummary: false,
      },
    }
  }

  @Put()
  updateSettings(@Body() _body: Record<string, unknown>) {
    return { success: true }
  }
}
