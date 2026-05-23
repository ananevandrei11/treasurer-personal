import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsEnum, IsOptional, IsDateString, IsUUID, Matches, MaxLength } from 'class-validator'
import { TransactionType } from '@prisma/client'

/** Input DTO for creating a new transaction. */
export class CreateTransactionDto {
  @ApiProperty({ example: '150.50', description: 'Decimal string with up to 2 decimal places' })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'amount must be a decimal string with up to 2 decimal places' })
  amount!: string

  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  type!: TransactionType

  @ApiPropertyOptional({ example: 'Coffee', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string

  @ApiProperty({ example: '2026-05-18T00:00:00.000Z' })
  @IsDateString()
  date!: string

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  categoryId!: string
}
