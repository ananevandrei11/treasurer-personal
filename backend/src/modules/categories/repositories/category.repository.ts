import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import type { Category } from '@prisma/client'

/**
 * Prisma-backed repository for the Category aggregate.
 * All queries are scoped to a user via `userId` to enforce ownership.
 */
@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new category record.
   *
   * @param data - Category fields: name, color, icon, userId.
   * @returns The created Prisma Category entity.
   */
  create(data: { name: string; color: string; icon: string; userId: string }): Promise<Category> {
    return this.prisma.category.create({ data })
  }

  /**
   * Returns a list of categories for a user.
   *
   * @param userId - Owner user UUID.
   * @returns Array of Category entities.
   */
  findAllByUser(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({ where: { userId } })
  }

  /**
   * Finds a single category by ID, scoped to the given user.
   *
   * @param id - Category UUID.
   * @param userId - Owner user UUID.
   * @returns The Category entity, or `null` if not found or not owned by the user.
   */
  findByIdForUser(id: string, userId: string): Promise<Category | null> {
    return this.prisma.category.findFirst({ where: { id, userId } })
  }

  /**
   * Updates specific fields of a category, enforcing user ownership via the WHERE clause.
   *
   * @param id - Category UUID.
   * @param userId - Owner user UUID.
   * @param data - Partial update payload (name, color, icon).
   * @returns The updated Category entity.
   */
  update(
    id: string,
    userId: string,
    data: { name?: string; color?: string; icon?: string },
  ): Promise<Category> {
    return this.prisma.category.update({ where: { id, userId }, data })
  }

  /**
   * Deletes a category, enforcing user ownership via the WHERE clause.
   *
   * @param id - Category UUID.
   * @param userId - Owner user UUID.
   * @returns void.
   */
  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.category.delete({ where: { id, userId } })
  }
}
