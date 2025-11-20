import { Module } from '@nestjs/common';
import { CallsService } from './calls.service';
import { CallsController } from './calls.controller';
import { CallsGateway } from './calls.gateway';
import { PrismaService } from '../../common/prisma.service';

@Module({
  providers: [CallsService, CallsGateway, PrismaService],
  controllers: [CallsController],
  exports: [CallsGateway],
})
export class CallsModule {}
