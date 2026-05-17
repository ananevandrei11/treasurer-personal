import { CommandHandler, QueryBus } from '@nestjs/cqrs'
import type { ICommandHandler } from '@nestjs/cqrs'
import { NotFoundException } from '@nestjs/common'
import type { Transaction } from '@prisma/client'
import { CreateTransactionCommand } from '../create-transaction.command'
import { TransactionRepository } from '../../repositories/transaction.repository'
import { GetCategoryByIdForUserQuery } from '../../../categories/queries/get-category-by-id-for-user.query'

@CommandHandler(CreateTransactionCommand)
export class CreateTransactionHandler implements ICommandHandler<CreateTransactionCommand, Transaction> {
  constructor(
    private readonly transactionRepo: TransactionRepository,
    private readonly queryBus: QueryBus,
  ) {}

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
