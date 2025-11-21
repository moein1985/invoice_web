import { IsOptional, IsEnum } from 'class-validator';
import { DocumentType } from '@prisma/client';

export class ConvertDocumentDto {
  @IsOptional()
  @IsEnum(DocumentType, { message: 'نوع سند نامعتبر است' })
  targetType?: DocumentType;
}
