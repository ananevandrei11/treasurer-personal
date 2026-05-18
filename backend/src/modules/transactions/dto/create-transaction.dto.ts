import { IsString, IsEnum, IsOptional, IsDateString, IsUUID, Matches, MaxLength } from 'class-validator'
import { TransactionType } from '@prisma/client'

/** Input DTO for creating a new transaction. */
export class CreateTransactionDto {
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'amount must be a decimal string with up to 2 decimal places' })
  amount!: string

  @IsEnum(TransactionType)
  type!: TransactionType

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string

  @IsDateString()
  date!: string

  @IsUUID()
  categoryId!: string
}
