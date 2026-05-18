import { CommandHandler, QueryBus } from '@nestjs/cqrs'
import type { ICommandHandler } from '@nestjs/cqrs'
import { NotFoundException } from '@nestjs/common'
import type { Transaction } from '@prisma/client'
import { CreateTransactionCommand } from '../create-transaction.command'
import { TransactionRepository } from '../../repositories/transaction.repository'
import { GetCategoryByIdForUserQuery } from '../../../categories/queries/get-category-by-id-for-user.query'

/**
 * Handles {@link CreateTransactionCommand}.
 * Validates category ownership before persisting the new transaction.
 */
@CommandHandler(CreateTransactionCommand)
export class CreateTransactionHandler implements ICommandHandler<CreateTransactionCommand, Transaction> {
  constructor(
    private readonly transactionRepo: TransactionRepository,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Executes the create-transaction command.
   *
   * @param command - Command carrying userId, amount, type, date, categoryId, optional description.
   * @returns The newly created Transaction entity.
   * @throws {NotFoundException} If the category does not exist or does not belong to the user.
   */
  async execute(command: CreateTransactionCommand): Promise<Transaction> {
    const category = await this.queryBus.execute(
      new GetCategoryByIdForUserQuery(command.categoryId, command.userId),
    )
    if (!category) throw new NotFoundException('Category not found')

    return this.transactionRepo.create({
      amount: command.amount,
      type: command.type,
      date: command.date,
      categoryId: command.categoryId,
      userId: command.userId,
      description: command.description,
    })
  }
}
