import { CommandHandler } from '@nestjs/cqrs'
import type { ICommandHandler } from '@nestjs/cqrs'
import { NotFoundException } from '@nestjs/common'
import { DeleteTransactionCommand } from '../delete-transaction.command'
import { TransactionRepository } from '../../repositories/transaction.repository'

/**
 * Handles {@link DeleteTransactionCommand}.
 * Verifies that the transaction exists and is owned by the user before deleting it.
 */
@CommandHandler(DeleteTransactionCommand)
export class DeleteTransactionHandler implements ICommandHandler<DeleteTransactionCommand, void> {
  constructor(private readonly transactionRepo: TransactionRepository) {}

  /**
   * Executes the delete-transaction command.
   *
   * @param command - Command carrying transaction id and userId.
   * @returns void.
   * @throws {NotFoundException} If the transaction does not exist or belongs to another user.
   */
  async execute(command: DeleteTransactionCommand): Promise<void> {
    const existing = await this.transactionRepo.findByIdForUser(command.id, command.userId)
    if (!existing) throw new NotFoundException()
    await this.transactionRepo.delete(command.id, command.userId)
  }
}
