import { QueryHandler } from '@nestjs/cqrs'
import type { IQueryHandler } from '@nestjs/cqrs'
import { BadRequestException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { GetTransactionsByUserQuery } from '../get-transactions-by-user.query'
import { TransactionRepository } from '../../repositories/transaction.repository'
import { ListTransactionsDto } from '../../dto/list-transactions.dto'
import { TransactionDto } from '../../dto/transaction.dto'

@QueryHandler(GetTransactionsByUserQuery)
export class GetTransactionsByUserHandler
  implements IQueryHandler<GetTransactionsByUserQuery, ListTransactionsDto>
{
  constructor(private readonly transactionRepo: TransactionRepository) {}

  async execute(query: GetTransactionsByUserQuery): Promise<ListTransactionsDto> {
    const { userId, month, year, page, limit } = query
    const hasMonth = month !== undefined
    const hasYear = year !== undefined

    if (hasMonth !== hasYear) {
      throw new BadRequestException('Both month and year must be provided together')
    }

    let dateFrom: Date | undefined
    let dateTo: Date | undefined

    if (hasMonth && hasYear) {
      dateFrom = new Date(year!, month! - 1, 1)
      dateTo = new Date(year!, month!, 0, 23, 59, 59, 999)
    }

    const skip = (page - 1) * limit

    const [transactions, total, sums] = await Promise.all([
      this.transactionRepo.findAllByUser(userId, dateFrom, dateTo, { skip, take: limit }),
      this.transactionRepo.countByUser(userId, dateFrom, dateTo),
      this.transactionRepo.sumByTypeForUser(userId, dateFrom, dateTo),
    ])

    const incomeRow = sums.find((s) => s.type === 'INCOME')
    const expenseRow = sums.find((s) => s.type === 'EXPENSE')

    const totalIncome = new Prisma.Decimal(incomeRow?._sum?.amount ?? '0')
    const totalExpense = new Prisma.Decimal(expenseRow?._sum?.amount ?? '0')
    const balance = totalIncome.minus(totalExpense)

    const result = new ListTransactionsDto()
    result.transactions = transactions.map((t) => TransactionDto.fromEntity(t))
    result.summary = {
      totalIncome: totalIncome.toFixed(2),
      totalExpense: totalExpense.toFixed(2),
      balance: balance.toFixed(2),
      count: total,
    }
    result.pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }

    return result
  }
}
