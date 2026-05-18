import { QueryHandler } from '@nestjs/cqrs'
import type { IQueryHandler } from '@nestjs/cqrs'
import type { Transaction } from '@prisma/client'
import { GetTransactionByIdForUserQuery } from '../get-transaction-by-id-for-user.query'
import { TransactionRepository } from '../../repositories/transaction.repository'

/**
 * Handles {@link GetTransactionByIdForUserQuery}.
 * Delegates ownership-scoped lookup to the repository.
 */
@QueryHandler(GetTransactionByIdForUserQuery)
export class GetTransactionByIdForUserHandler
  implements IQueryHandler<GetTransactionByIdForUserQuery, Transaction | null>
{
  constructor(private readonly transactionRepo: TransactionRepository) {}

  /**
   * Executes the get-transaction-by-id-for-user query.
   *
   * @param query - Query carrying transaction id and userId.
   * @returns The Transaction entity, or `null` if not found or not owned by the user.
   */
  execute(query: GetTransactionByIdForUserQuery): Promise<Transaction | null> {
    return this.transactionRepo.findByIdForUser(query.id, query.userId)
  }
}
