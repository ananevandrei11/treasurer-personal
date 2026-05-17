import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import type { Transaction, TransactionType, Prisma } from '@prisma/client'

@Injectable()
export class TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  findAllByUser(userId: string, dateFrom?: Date, dateTo?: Date): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: {
        userId,
        ...(dateFrom && dateTo ? { date: { gte: dateFrom, lte: dateTo } } : {}),
      },
      orderBy: { date: 'desc' },
    })
  }

  sumByTypeForUser(
    userId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<{ type: TransactionType; _sum: { amount: Prisma.Decimal | null } }[]> {
    return this.prisma.transaction.groupBy({
      by: ['type'],
      where: {
        userId,
        ...(dateFrom && dateTo ? { date: { gte: dateFrom, lte: dateTo } } : {}),
      },
      _sum: { amount: true },
    }) as unknown as Promise<{ type: TransactionType; _sum: { amount: Prisma.Decimal | null } }[]>
  }

  findByIdForUser(id: string, userId: string): Promise<Transaction | null> {
    return this.prisma.transaction.findFirst({ where: { id, userId } })
  }

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

  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.transaction.delete({ where: { id, userId } })
  }
}
