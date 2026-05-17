import { CommandHandler } from '@nestjs/cqrs'
import type { ICommandHandler } from '@nestjs/cqrs'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { DeleteCategoryCommand } from '../delete-category.command'
import { CategoryRepository } from '../../repositories/category.repository'

@CommandHandler(DeleteCategoryCommand)
export class DeleteCategoryHandler implements ICommandHandler<DeleteCategoryCommand, void> {
  constructor(private readonly categoryRepo: CategoryRepository) {}

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
