import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import type { Transaction, TransactionType } from '@prisma/client'

/**
 * Prisma-backed repository for the Transaction aggregate.
 * All queries are scoped to a user via `userId` to enforce ownership.
 */
@Injectable()
export class TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new transaction record.
   *
   * @param data - Transaction fields: amount (decimal string), type, date, categoryId, userId, optional description.
   * @returns The created Prisma Transaction entity.
   */
  create(data: {
    amount: string
    type: TransactionType
    description?: string
    date: Date
    categoryId: string
    userId: string
  }): Promise<Transaction> {
    return this.prisma.transaction.create({ data })
  }

  /**
   * Returns a list of transactions for a user, with optional date-range filtering and pagination.
   *
   * @param userId - Owner user UUID.
   * @param dateFrom - Start of the date range (inclusive).
   * @param dateTo - End of the date range (inclusive).
   * @param pagination - Optional `{ skip, take }` for page-based pagination.
   * @returns Array of Transaction entities ordered by date descending.
   */
  findAllByUser(
    userId: string,
    dateFrom?: Date,
    dateTo?: Date,
    pagination?: { skip: number; take: number },
  ): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: {
        userId,
        ...(dateFrom && dateTo ? { date: { gte: dateFrom, lte: dateTo } } : {}),
      },
      orderBy: { date: 'desc' },
      ...(pagination ? { skip: pagination.skip, take: pagination.take } : {}),
    })
  }

  /**
   * Counts transactions for a user, with optional date-range filtering.
   *
   * @param userId - Owner user UUID.
   * @param dateFrom - Start of the date range (inclusive).
   * @param dateTo - End of the date range (inclusive).
   * @returns Total number of matching transactions.
   */
  countByUser(userId: string, dateFrom?: Date, dateTo?: Date): Promise<number> {
    return this.prisma.transaction.count({
      where: {
        userId,
        ...(dateFrom && dateTo ? { date: { gte: dateFrom, lte: dateTo } } : {}),
      },
    })
  }

  /**
   * Aggregates the sum of transaction amounts grouped by type (INCOME / EXPENSE).
   *
   * @param userId - Owner user UUID.
   * @param dateFrom - Start of the date range (inclusive).
   * @param dateTo - End of the date range (inclusive).
   * @returns GroupBy result with `type` and `_sum.amount` per group.
   */
  sumByTypeForUser(userId: string, dateFrom?: Date, dateTo?: Date) {
    return this.prisma.transaction.groupBy({
      by: ['type'],
      where: {
        userId,
        ...(dateFrom && dateTo ? { date: { gte: dateFrom, lte: dateTo } } : {}),
      },
      _sum: { amount: true },
    })
  }

  /**
   * Finds a single transaction by ID, scoped to the given user.
   *
   * @param id - Transaction UUID.
   * @param userId - Owner user UUID.
   * @returns The Transaction entity, or `null` if not found or not owned by the user.
   */
  findByIdForUser(id: string, userId: string): Promise<Transaction | null> {
    return this.prisma.transaction.findFirst({ where: { id, userId } })
  }

  /**
   * Updates specific fields of a transaction, enforcing user ownership via the WHERE clause.
   *
   * @param id - Transaction UUID.
   * @param userId - Owner user UUID.
   * @param data - Partial update payload (amount, type, description, date, categoryId).
   * @returns The updated Transaction entity.
   */
  update(
    id: string,
    userId: string,
    data: {
      amount?: string
      type?: TransactionType
      description?: string
      date?: Date
      categoryId?: string
    },
  ): Promise<Transaction> {
    return this.prisma.transaction.update({ where: { id, userId }, data })
  }

  /**
   * Deletes a transaction, enforcing user ownership via the WHERE clause.
   *
   * @param id - Transaction UUID.
   * @param userId - Owner user UUID.
   * @returns void.
   */
  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.transaction.delete({ where: { id, userId } })
  }
}
