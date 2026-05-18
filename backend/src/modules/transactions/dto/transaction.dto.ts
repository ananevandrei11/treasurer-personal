import type { Transaction, TransactionType } from '@prisma/client'

/**
 * Response DTO for a single transaction.
 * `amount` is serialized as a string to preserve Decimal precision.
 */
export class TransactionDto {
  id!: string
  amount!: string
  type!: TransactionType
  description!: string | null
  date!: Date
  categoryId!: string
  createdAt!: Date
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
