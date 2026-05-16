import { CommandHandler } from '@nestjs/cqrs'
import type { ICommandHandler } from '@nestjs/cqrs'
import { NotFoundException } from '@nestjs/common'
import { DeleteCategoryCommand } from '../delete-category.command'
import { CategoryRepository } from '../../repositories/category.repository'

@CommandHandler(DeleteCategoryCommand)
export class DeleteCategoryHandler implements ICommandHandler<DeleteCategoryCommand, void> {
  constructor(private readonly categoryRepo: CategoryRepository) {}

  async execute(command: DeleteCategoryCommand): Promise<void> {
    const existing = await this.categoryRepo.findByIdForUser(command.id, command.userId)
    if (!existing) throw new NotFoundException()
    await this.categoryRepo.delete(command.id, command.userId)
  }
}
