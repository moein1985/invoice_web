import { PartialType } from '@nestjs/mapped-types';
import { CreateDocumentDto } from './create-document.dto';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateDocumentDto extends PartialType(CreateDocumentDto) {
  @IsEnum(['draft', 'pending', 'approved', 'rejected'])
  @IsOptional()
  status?: string;
}
