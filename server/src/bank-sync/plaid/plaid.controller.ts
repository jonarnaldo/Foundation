import { Controller, Post, Get, Delete, Body, Param, Req, UseGuards } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { BankAccount } from '../../database/entities/bank-account.entity'
import { BankTransaction, MatchStatus, TransactionType, PaymentChannel } from '../../database/entities/bank-transaction.entity'

const SANDBOX_INSTITUTIONS = [
  { name: 'Chase', mask: '4321', type: 'checking' },
  { name: 'Bank of America', mask: '8765', type: 'checking' },
  { name: 'Wells Fargo', mask: '1234', type: 'savings' },
]

const SANDBOX_TRANSACTIONS = [
  { description: 'Home Depot Supply', amount: 458700, type: TransactionType.WITHDRAWAL, channel: PaymentChannel.CARD },
  { description: 'CHECK #1042 - Subcontractor Payment', amount: 1250000, type: TransactionType.WITHDRAWAL, channel: PaymentChannel.CHECK },
  { description: 'Client Draw Receipt - Pacific Coast Dev', amount: 5000000, type: TransactionType.DEPOSIT, channel: PaymentChannel.ACH },
  { description: 'CHECK #1043 - Concrete Supply Co', amount: 387500, type: TransactionType.WITHDRAWAL, channel: PaymentChannel.CHECK },
  { description: 'ACH - Lumber Yard', amount: 214300, type: TransactionType.WITHDRAWAL, channel: PaymentChannel.ACH },
]

@ApiTags('plaid')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PlaidController {
  constructor(
    @InjectRepository(BankAccount)
    private readonly accountRepo: Repository<BankAccount>,
    @InjectRepository(BankTransaction)
    private readonly txRepo: Repository<BankTransaction>,
  ) {}

  @Post('plaid/link-token')
  createLinkToken() {
    return { linkToken: `link-sandbox-${Date.now()}` }
  }

  @Post('plaid/exchange-token')
  async exchangeToken(
    @Req() req: { user: { sub: string } },
    @Body() body: { publicToken: string; institutionName?: string; accountName?: string },
  ) {
    const institution = SANDBOX_INSTITUTIONS[Math.floor(Math.random() * SANDBOX_INSTITUTIONS.length)]
    const account = this.accountRepo.create({
      userId: req.user.sub,
      plaidItemId: `item-sandbox-${Date.now()}`,
      plaidAccessToken: `access-sandbox-${Date.now()}`,
      institutionName: body.institutionName ?? institution.name,
      accountName: body.accountName ?? `${institution.name} ${institution.type.charAt(0).toUpperCase() + institution.type.slice(1)}`,
      accountType: institution.type,
      accountMask: institution.mask,
      lastSyncedAt: new Date(),
      isActive: true,
    })
    const saved = await this.accountRepo.save(account)

    // Seed sandbox transactions
    const today = new Date()
    const txEntities = SANDBOX_TRANSACTIONS.map((t, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - i * 3)
      return this.txRepo.create({
        bankAccountId: saved.id,
        plaidTransactionId: `txn-sandbox-${saved.id}-${i}`,
        transactionType: t.type,
        paymentChannel: t.channel,
        amount: t.amount,
        currencyCode: 'USD',
        postedDate: d.toISOString().slice(0, 10),
        description: t.description,
        matchStatus: MatchStatus.UNMATCHED,
      })
    })
    await this.txRepo.save(txEntities)

    return { success: true, bankAccountId: saved.id }
  }

  @Get('bank-accounts')
  listBankAccounts(@Req() req: { user: { sub: string } }) {
    return this.accountRepo.find({
      where: { userId: req.user.sub, isActive: true },
      order: { createdAt: 'DESC' },
    })
  }

  @Post('bank-accounts/:id/sync')
  async syncBankAccount(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    await this.accountRepo.update({ id, userId: req.user.sub }, { lastSyncedAt: new Date() })
    return { success: true, message: 'Sync job queued' }
  }

  @Delete('bank-accounts/:id')
  async removeBankAccount(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    await this.accountRepo.update({ id, userId: req.user.sub }, { isActive: false })
    return { success: true, isActive: false }
  }
}
