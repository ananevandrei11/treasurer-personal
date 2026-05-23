import { CommandHandler } from '@nestjs/cqrs'
import { QueryBus } from '@nestjs/cqrs'
import type { ICommandHandler } from '@nestjs/cqrs'
import { NotFoundException } from '@nestjs/common'
import type { Category } from '@prisma/client'
import { CreateCategoryCommand } from '../create-category.command'
import { CategoryRepository } from '../../repositories/category.repository'
import { GetUserByIdQuery } from '../../../users/queries/get-user-by-id.query'

/**
 * Handles {@link CreateCategoryCommand}.
 * Validates user existence before persisting the new category.
 */
@CommandHandler(CreateCategoryCommand)
export class CreateCategoryHandler implements ICommandHandler<CreateCategoryCommand, Category> {
  constructor(
    private readonly categoryRepo: CategoryRepository,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Executes the create-category command.
   *
   * @param command - Command carrying userId, name, color, and icon.
   * @returns The newly created Category entity.
   * @throws {NotFoundException} If the user does not exist.
   */
  async execute(command: CreateCategoryCommand): Promise<Category> {
    const user = await this.queryBus.execute(new GetUserByIdQuery(command.userId))
    if (!user) throw new NotFoundException('User not found')
    return this.categoryRepo.create({
      name: command.name,
      color: command.color,
      userId: command.userId,
    })
  }
}
