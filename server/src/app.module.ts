import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProjectsModule } from './projects/projects.module'
import { FinanceModule } from './finance/finance.module'
import { BankSyncModule } from './bank-sync/bank-sync.module'
import { QuickBooksModule } from './quickbooks/quickbooks.module'
import { AuthModule } from './auth/auth.module'
import { SearchModule } from './search/search.module'
import { SettingsModule } from './settings/settings.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        url: cfg.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: cfg.get('NODE_ENV') !== 'production',
        logging: cfg.get('NODE_ENV') === 'development',
      }),
    }),
    AuthModule,
    ProjectsModule,
    FinanceModule,
    BankSyncModule,
    QuickBooksModule,
    SearchModule,
    SettingsModule,
  ],
})
export class AppModule {}
