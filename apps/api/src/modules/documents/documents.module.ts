import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { PrismaService } from '../../common/prisma.service';

@Module({
  providers: [DocumentsService, PrismaService],
  controllers: [DocumentsController],
})
export class DocumentsModule {}
