import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentConversionService } from './services/document-conversion.service';
import { DocumentApprovalService } from './services/document-approval.service';
import { DocumentsController } from './documents.controller';
import { PrismaService } from '../../common/prisma.service';

@Module({
  providers: [
    DocumentsService,
    DocumentConversionService,
    DocumentApprovalService,
    PrismaService,
  ],
  controllers: [DocumentsController],
  exports: [
    DocumentsService,
    DocumentConversionService,
    DocumentApprovalService,
  ],
})
export class DocumentsModule {}
