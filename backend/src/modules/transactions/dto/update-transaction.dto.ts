import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsEnum, IsOptional, IsDateString, IsUUID, Matches, MaxLength } from 'class-validator'
import { TransactionType } from '@prisma/client'

/** Input DTO for partially updating an existing transaction. All fields are optional. */
export class UpdateTransactionDto {
  @ApiPropertyOptional({ example: '150.50', description: 'Decimal string with up to 2 decimal places' })
  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'amount must be a decimal string with up to 2 decimal places' })
  amount?: string

  @ApiPropertyOptional({ enum: TransactionType })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType

  @ApiPropertyOptional({ example: 'Coffee', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string

  @ApiPropertyOptional({ example: '2026-05-18T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  date?: string

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  categoryId?: string
}
