import { QueryHandler } from '@nestjs/cqrs'
import type { IQueryHandler } from '@nestjs/cqrs'
import type { Category } from '@prisma/client'
import { GetCategoriesByUserQuery } from '../get-categories-by-user.query'
import { CategoryRepository } from '../../repositories/category.repository'

/**
 * Handles {@link GetCategoriesByUserQuery}.
 * Delegates retrieval of all user categories to the repository.
 */
@QueryHandler(GetCategoriesByUserQuery)
export class GetCategoriesByUserHandler implements IQueryHandler<
  GetCategoriesByUserQuery,
  Category[]
> {
  constructor(private readonly categoryRepo: CategoryRepository) {}

  /**
   * Executes the get-categories-by-user query.
   *
   * @param query - Query carrying userId.
   * @returns Array of Category entities.
   */
  execute(query: GetCategoriesByUserQuery): Promise<Category[]> {
    return this.categoryRepo.findAllByUser(query.userId)
  }
}
