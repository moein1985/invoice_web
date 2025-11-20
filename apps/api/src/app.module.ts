import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { CustomersModule } from './modules/customers/customers.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { StatsModule } from './modules/stats/stats.module';
import { CallsModule } from './modules/calls/calls.module';

@Module({
  imports: [AuthModule, CustomersModule, DocumentsModule, StatsModule, CallsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
