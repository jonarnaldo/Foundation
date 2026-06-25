import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'

@ApiTags('plaid')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PlaidController {
  @Post('plaid/link-token')
  createLinkToken() {
    return { linkToken: `link-sandbox-${Date.now()}` }
  }

  @Post('plaid/exchange-token')
  exchangeToken(@Body() _body: { publicToken: string }) {
    return { success: true, message: 'Bank account connected' }
  }

  @Get('bank-accounts')
  listBankAccounts() {
    return []
  }

  @Delete('bank-accounts/:id')
  removeBankAccount(@Param('id') _id: string) {
    return { success: true }
  }

  @Post('bank-accounts/:id/sync')
  syncBankAccount(@Param('id') _id: string) {
    return { success: true, message: 'Sync job queued' }
  }
}
