import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Project } from '../database/entities/project.entity'
import { BankTransaction } from '../database/entities/bank-transaction.entity'
import { SearchController } from './search.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Project, BankTransaction])],
  controllers: [SearchController],
})
export class SearchModule {}
