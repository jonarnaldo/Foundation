import { Controller, Get, Post, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'

@ApiTags('quickbooks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('integrations/quickbooks')
export class QuickBooksController {
  @Get('status')
  getStatus() {
    return { status: 'disconnected' }
  }

  @Post('connect')
  connect() {
    return { url: `https://appcenter.intuit.com/connect/oauth2?client_id=${process.env.QB_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.QB_REDIRECT_URI || '')}&response_type=code&scope=com.intuit.quickbooks.accounting&state=foundation` }
  }

  @Post('disconnect')
  disconnect() {
    return { success: true }
  }

  @Post('sync')
  sync() {
    return { success: true, message: 'QuickBooks sync job queued' }
  }

  @Get('item-codes')
  getItemCodes() {
    return [
      { id: 'LABOR-001', name: 'Labor' },
      { id: 'MATERIALS-001', name: 'Materials' },
      { id: 'SUBCONTRACTOR-001', name: 'Subcontractor' },
      { id: 'EQUIPMENT-001', name: 'Equipment' },
    ]
  }
}
