import { CommandHandler } from '@nestjs/cqrs'
import type { ICommandHandler } from '@nestjs/cqrs'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { DeleteCategoryCommand } from '../delete-category.command'
import { CategoryRepository } from '../../repositories/category.repository'

/**
 * Handles {@link DeleteCategoryCommand}.
 * Verifies that the category exists and is owned by the user before deleting it.
 * Also checks for existing transactions to prevent orphaned records.
 */
@CommandHandler(DeleteCategoryCommand)
export class DeleteCategoryHandler implements ICommandHandler<DeleteCategoryCommand, void> {
  constructor(private readonly categoryRepo: CategoryRepository) {}

  /**
   * Executes the delete-category command.
   *
   * @param command - Command carrying category id and userId.
   * @returns void.
   * @throws {NotFoundException} If the category does not exist or belongs to another user.
   * @throws {ConflictException} If the category has associated transactions.
   */
  async execute(command: DeleteCategoryCommand): Promise<void> {
    const existing = await this.categoryRepo.findByIdForUser(command.id, command.userId)
    if (!existing) throw new NotFoundException()
    try {
      await this.categoryRepo.delete(command.id, command.userId)
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new ConflictException('Category has transactions and cannot be deleted')
      }
      throw err
    }
  }
}
