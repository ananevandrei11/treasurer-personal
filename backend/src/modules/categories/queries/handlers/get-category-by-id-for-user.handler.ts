import { QueryHandler } from '@nestjs/cqrs'
import type { IQueryHandler } from '@nestjs/cqrs'
import type { Category } from '@prisma/client'
import { GetCategoryByIdForUserQuery } from '../get-category-by-id-for-user.query'
import { CategoryRepository } from '../../repositories/category.repository'

/**
 * Handles {@link GetCategoryByIdForUserQuery}.
 * Delegates ownership-scoped lookup to the repository.
 */
@QueryHandler(GetCategoryByIdForUserQuery)
export class GetCategoryByIdForUserHandler implements IQueryHandler<
  GetCategoryByIdForUserQuery,
  Category | null
> {
  constructor(private readonly categoryRepo: CategoryRepository) {}

  /**
   * Executes the get-category-by-id-for-user query.
   *
   * @param query - Query carrying category id and userId.
   * @returns The Category entity, or `null` if not found or not owned by the user.
   */
  execute(query: GetCategoryByIdForUserQuery): Promise<Category | null> {
    return this.categoryRepo.findByIdForUser(query.id, query.userId)
  }
}
