import { IsString, IsEnum, IsOptional, IsDateString, IsUUID, Matches, MaxLength } from 'class-validator'
import { TransactionType } from '@prisma/client'

export class UpdateTransactionDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'amount must be a decimal string with up to 2 decimal places' })
  amount?: string

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string

  @IsOptional()
  @IsDateString()
  date?: string

  @IsOptional()
  @IsUUID()
  categoryId?: string
}
