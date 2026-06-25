import { Module } from '@nestjs/common'
import { QuickBooksController } from './quickbooks.controller'

@Module({
  controllers: [QuickBooksController],
})
export class QuickBooksModule {}
