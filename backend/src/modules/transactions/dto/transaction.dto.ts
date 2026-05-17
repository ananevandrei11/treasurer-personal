import type { Transaction, TransactionType } from '@prisma/client'

export class TransactionDto {
  id!: string
  amount!: string
  type!: TransactionType
  description!: string | null
  date!: Date
  categoryId!: string
  createdAt!: Date
  updatedAt!: Date

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
