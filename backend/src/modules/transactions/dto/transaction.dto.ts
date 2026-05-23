import { ApiProperty } from '@nestjs/swagger'
import type { Transaction, TransactionType } from '@prisma/client'

/**
 * Response DTO for a single transaction.
 * `amount` is serialized as a string to preserve Decimal precision.
 */
export class TransactionDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string

  @ApiProperty({ example: '150.50', description: 'Decimal string with up to 2 decimal places' })
  amount!: string

  @ApiProperty({ enum: ['INCOME', 'EXPENSE'] })
  type!: TransactionType

  @ApiProperty({ example: 'Coffee', nullable: true })
  description!: string | null

  @ApiProperty({ example: '2026-05-18T00:00:00.000Z' })
  date!: Date

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  categoryId!: string

  @ApiProperty()
  createdAt!: Date

  @ApiProperty()
  updatedAt!: Date

  /**
   * Maps a Prisma Transaction entity to a TransactionDto.
   *
   * @param entity - The raw Prisma Transaction row.
   * @returns A new TransactionDto with `amount` coerced to string.
   */
  static fromEntity(entity: Transaction): TransactionDto {
    const dto = new TransactionDto()
    dto.id = entity.id
    dto.amount = entity.amount.toString()
    dto.type = entity.type
    dto.description = entity.description
    dto.date = entity.date
    dto.categoryId = entity.categoryId
    dto.createdAt = entity.createdAt
    dto.updatedAt = entity.updatedAt
    return dto
  }
}
