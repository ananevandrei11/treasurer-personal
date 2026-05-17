import { CommandHandler, QueryBus } from '@nestjs/cqrs'
import type { ICommandHandler } from '@nestjs/cqrs'
import { NotFoundException } from '@nestjs/common'
import type { Transaction } from '@prisma/client'
import { UpdateTransactionCommand } from '../update-transaction.command'
import { TransactionRepository } from '../../repositories/transaction.repository'
import { GetCategoryByIdForUserQuery } from '../../../categories/queries/get-category-by-id-for-user.query'

@CommandHandler(UpdateTransactionCommand)
export class UpdateTransactionHandler implements ICommandHandler<UpdateTransactionCommand, Transaction> {
  constructor(
    private readonly transactionRepo: TransactionRepository,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: UpdateTransactionCommand): Promise<Transaction> {
    const existing = await this.transactionRepo.findByIdForUser(command.id, command.userId)
    if (!existing) throw new NotFoundException()

    if (command.categoryId) {
      const category = await this.queryBus.execute(
        new GetCategoryByIdForUserQuery(command.categoryId, command.userId),
      )
      if (!category) throw new NotFoundException('Category not found')
    }

    return this.transactionRepo.update(command.id, command.userId, {
      amount: command.amount,
      type: command.type,
      date: command.date,
      categoryId: command.categoryId,
      description: command.description,
    })
  }
}
