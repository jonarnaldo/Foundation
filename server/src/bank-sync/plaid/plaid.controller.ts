import { Controller, Post, Get, Delete, Body, Param, Req, UseGuards } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid'
import { BankAccount } from '../../database/entities/bank-account.entity'
import { BankTransaction, MatchStatus, TransactionType, PaymentChannel } from '../../database/entities/bank-transaction.entity'

function makePlaidClient() {
  const env = process.env.PLAID_ENV ?? 'sandbox'
  const config = new Configuration({
    basePath: PlaidEnvironments[env] ?? PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  })
  return new PlaidApi(config)
}

function toTransactionType(amount: number): TransactionType {
  return amount > 0 ? TransactionType.WITHDRAWAL : TransactionType.DEPOSIT
}

function toPaymentChannel(channel: string): PaymentChannel {
  const map: Record<string, PaymentChannel> = {
    online: PaymentChannel.CARD,
    'in store': PaymentChannel.CARD,
    in_store: PaymentChannel.CARD,
    other: PaymentChannel.OTHER,
  }
  return map[channel?.toLowerCase()] ?? PaymentChannel.OTHER
}

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
  async createLinkToken(@Req() req: { user: { sub: string } }) {
    const plaid = makePlaidClient()
    const response = await plaid.linkTokenCreate({
      user: { client_user_id: req.user.sub },
      client_name: 'Foundation',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    })
    return { linkToken: response.data.link_token }
  }

  @Post('plaid/exchange-token')
  async exchangeToken(
    @Req() req: { user: { sub: string } },
    @Body() body: { publicToken: string },
  ) {
    const plaid = makePlaidClient()

    const exchangeRes = await plaid.itemPublicTokenExchange({ public_token: body.publicToken })
    const accessToken = exchangeRes.data.access_token
    const itemId = exchangeRes.data.item_id

    const accountsRes = await plaid.accountsGet({ access_token: accessToken })
    const plaidAccount = accountsRes.data.accounts[0]

    const account = this.accountRepo.create({
      userId: req.user.sub,
      plaidItemId: itemId,
      plaidAccountId: plaidAccount.account_id,
      plaidAccessToken: accessToken,
      institutionName: accountsRes.data.item.institution_id ?? 'Bank',
      accountName: plaidAccount.name,
      accountType: plaidAccount.subtype ?? plaidAccount.type ?? 'checking',
      accountMask: plaidAccount.mask ?? '0000',
      lastSyncedAt: new Date(),
      isActive: true,
    })
    const saved = await this.accountRepo.save(account)

    await this.syncTransactions(plaid, saved)

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
    const account = await this.accountRepo.findOne({ where: { id, userId: req.user.sub, isActive: true } })
    if (account?.plaidAccessToken) {
      const plaid = makePlaidClient()
      await this.syncTransactions(plaid, account)
    }
    await this.accountRepo.update({ id, userId: req.user.sub }, { lastSyncedAt: new Date() })
    return { success: true, message: 'Sync complete' }
  }

  @Delete('bank-accounts/:id')
  async removeBankAccount(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    await this.accountRepo.update({ id, userId: req.user.sub }, { isActive: false })
    return { success: true, isActive: false }
  }

  private async syncTransactions(plaid: PlaidApi, account: BankAccount) {
    const endDate = new Date().toISOString().slice(0, 10)
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const res = await plaid.transactionsGet({
      access_token: account.plaidAccessToken,
      start_date: startDate,
      end_date: endDate,
    })

    const plaidTxns = res.data.transactions.filter(
      t => !account.plaidAccountId || t.account_id === account.plaidAccountId,
    )

    for (const t of plaidTxns) {
      const existing = await this.txRepo.findOne({ where: { plaidTransactionId: t.transaction_id } })
      if (existing) continue

      const tx = new BankTransaction()
      tx.bankAccountId = account.id
      tx.plaidTransactionId = t.transaction_id
      tx.transactionType = toTransactionType(t.amount)
      tx.paymentChannel = toPaymentChannel(t.payment_channel)
      tx.amount = Math.round(Math.abs(t.amount) * 100)
      tx.currencyCode = t.iso_currency_code ?? 'USD'
      tx.postedDate = t.date
      tx.authorizedDate = t.authorized_date ?? null
      tx.description = t.merchant_name ?? t.original_description ?? t.transaction_id
      tx.checkNumber = t.check_number ?? null
      tx.matchStatus = MatchStatus.UNMATCHED
      await this.txRepo.save(tx)
    }
  }
}
