import { QueryHandler } from '@nestjs/cqrs'
import type { IQueryHandler } from '@nestjs/cqrs'
import type { Transaction } from '@prisma/client'
import { GetTransactionByIdForUserQuery } from '../get-transaction-by-id-for-user.query'
import { TransactionRepository } from '../../repositories/transaction.repository'

@QueryHandler(GetTransactionByIdForUserQuery)
export class GetTransactionByIdForUserHandler
  implements IQueryHandler<GetTransactionByIdForUserQuery, Transaction | null>
{
  constructor(private readonly transactionRepo: TransactionRepository) {}

  execute(query: GetTransactionByIdForUserQuery): Promise<Transaction | null> {
    return this.transactionRepo.findByIdForUser(query.id, query.userId)
  }
}
