import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDate,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentType } from '@prisma/client';

export class CreateDocumentItemDto {
  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  purchasePrice?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  profitPercentage?: number;

  @IsBoolean()
  @IsOptional()
  isManualPrice?: boolean;
}

export class CreateDocumentDto {
  @IsEnum(DocumentType, { message: 'نوع سند نامعتبر است' })
  @IsNotEmpty()
  documentType!: DocumentType;

  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @Type(() => Date)
  @IsDate()
  issueDate!: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dueDate?: Date;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discountAmount?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDocumentItemDto)
  items!: CreateDocumentItemDto[];

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  attachment?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  defaultProfitPercentage?: number;

  @IsBoolean()
  @IsOptional()
  requiresApproval?: boolean;
}
