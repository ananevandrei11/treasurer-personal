import { CommandHandler } from '@nestjs/cqrs'
import type { ICommandHandler } from '@nestjs/cqrs'
import { NotFoundException } from '@nestjs/common'
import { DeleteTransactionCommand } from '../delete-transaction.command'
import { TransactionRepository } from '../../repositories/transaction.repository'

@CommandHandler(DeleteTransactionCommand)
export class DeleteTransactionHandler implements ICommandHandler<DeleteTransactionCommand, void> {
  constructor(private readonly transactionRepo: TransactionRepository) {}

  async execute(command: DeleteTransactionCommand): Promise<void> {
    const existing = await this.transactionRepo.findByIdForUser(command.id, command.userId)
    if (!existing) throw new NotFoundException()
    await this.transactionRepo.delete(command.id, command.userId)
  }
}
