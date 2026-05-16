import { QueryHandler } from '@nestjs/cqrs'
import type { IQueryHandler } from '@nestjs/cqrs'
import type { Category } from '@prisma/client'
import { GetCategoryByIdForUserQuery } from '../get-category-by-id-for-user.query'
import { CategoryRepository } from '../../repositories/category.repository'

@QueryHandler(GetCategoryByIdForUserQuery)
export class GetCategoryByIdForUserHandler implements IQueryHandler<
  GetCategoryByIdForUserQuery,
  Category | null
> {
  constructor(private readonly categoryRepo: CategoryRepository) {}

  execute(query: GetCategoryByIdForUserQuery): Promise<Category | null> {
    return this.categoryRepo.findByIdForUser(query.id, query.userId)
  }
}
