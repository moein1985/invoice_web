import { PartialType } from '@nestjs/mapped-types';
import { CreateCallDto } from './create-call.dto';
import { IsOptional, IsEnum } from 'class-validator';

export class UpdateCallDto extends PartialType(CreateCallDto) {
  @IsOptional()
  @IsEnum(['answered', 'missed', 'busy', 'failed'])
  status?: string;
}
