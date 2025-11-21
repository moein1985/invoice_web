import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RejectDocumentDto {
  @IsNotEmpty({ message: 'دلیل رد الزامی است' })
  @IsString({ message: 'دلیل رد باید متن باشد' })
  @MinLength(10, { message: 'دلیل رد باید حداقل ۱۰ کاراکتر باشد' })
  reason!: string;
}
