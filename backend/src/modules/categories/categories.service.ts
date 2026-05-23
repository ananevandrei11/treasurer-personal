import { Injectable } from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import type { Category } from '@prisma/client'
import { CreateCategoryCommand } from './commands/create-category.command'
import { UpdateCategoryCommand } from './commands/update-category.command'
import { DeleteCategoryCommand } from './commands/delete-category.command'
import { GetCategoriesByUserQuery } from './queries/get-categories-by-user.query'
import { GetCategoryByIdForUserQuery } from './queries/get-category-by-id-for-user.query'

/**
 * Application service for the Categories domain.
 * Delegates reads to QueryBus and writes to CommandBus.
 */
@Injectable()
export class CategoriesService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Fetches all categories for a user.
   *
   * @param userId - Owner user UUID.
   * @returns Array of Category entities.
   */
  findAll(userId: string): Promise<Category[]> {
    return this.queryBus.execute(new GetCategoriesByUserQuery(userId))
  }

  /**
   * Fetches a single category by ID, scoped to the given user.
   *
   * @param id - Category UUID.
   * @param userId - Owner user UUID.
   * @returns The Prisma Category entity, or `null` if not found or not owned by the user.
   */
  findOne(id: string, userId: string): Promise<Category | null> {
    return this.queryBus.execute(new GetCategoryByIdForUserQuery(id, userId))
  }

  /**
   * Creates a new category for the given user.
   *
   * @param userId - Owner user UUID.
   * @param name - Category name.
   * @param color - Hex color string.
   * @param icon - Icon identifier string.
   * @returns The created Prisma Category entity.
   */
  create(userId: string, name: string, color: string): Promise<Category> {
    return this.commandBus.execute(new CreateCategoryCommand(userId, name, color))
  }

  /**
   * Updates an existing category owned by the user.
   *
   * @param id - Category UUID.
   * @param userId - Owner user UUID.
   * @param name - New category name.
   * @param color - New hex color string.
   * @param icon - New icon identifier string.
   * @returns The updated Prisma Category entity.
   */
  update(
    id: string,
    userId: string,
    name?: string,
    color?: string,
  ): Promise<Category> {
    return this.commandBus.execute(new UpdateCategoryCommand(id, userId, name, color))
  }

  /**
   * Deletes a category owned by the user.
   *
   * @param id - Category UUID.
   * @param userId - Owner user UUID.
   * @returns void.
   */
  remove(id: string, userId: string): Promise<void> {
    return this.commandBus.execute(new DeleteCategoryCommand(id, userId))
  }
}
