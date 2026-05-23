import { CommandHandler } from '@nestjs/cqrs'
import type { ICommandHandler } from '@nestjs/cqrs'
import { NotFoundException } from '@nestjs/common'
import type { Category } from '@prisma/client'
import { UpdateCategoryCommand } from '../update-category.command'
import { CategoryRepository } from '../../repositories/category.repository'

/**
 * Handles {@link UpdateCategoryCommand}.
 * Verifies category existence and ownership before applying the update.
 */
@CommandHandler(UpdateCategoryCommand)
export class UpdateCategoryHandler implements ICommandHandler<UpdateCategoryCommand, Category> {
  constructor(private readonly categoryRepo: CategoryRepository) {}

  /**
   * Executes the update-category command.
   *
   * @param command - Command carrying id, userId, and optional updated fields.
   * @returns The updated Category entity.
   * @throws {NotFoundException} If the category is not found or not owned by the user.
   */
  async execute(command: UpdateCategoryCommand): Promise<Category> {
    const existing = await this.categoryRepo.findByIdForUser(command.id, command.userId)
    if (!existing) throw new NotFoundException()
    return this.categoryRepo.update(command.id, command.userId, {
      name: command.name,
      color: command.color,
      icon: command.icon,
    })
  }
}
