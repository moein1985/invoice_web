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
} from 'class-validator';
import { Type } from 'class-transformer';

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
}

export class CreateDocumentDto {
  @IsEnum(['invoice', 'quote', 'receipt', 'other'])
  @IsNotEmpty()
  documentType!: string;

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
}
