import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

export class CreateCallDto {
  @IsString()
  customerId!: string;

  @IsString()
  phoneNumber!: string;

  @IsEnum(['incoming', 'outgoing'])
  direction!: string;

  @IsDateString()
  startTime!: Date;

  @IsOptional()
  @IsDateString()
  endTime?: Date;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsEnum(['answered', 'missed', 'busy', 'failed'])
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  recordingUrl?: string;
}
