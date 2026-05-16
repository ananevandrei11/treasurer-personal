import { QueryHandler } from '@nestjs/cqrs'
import type { IQueryHandler } from '@nestjs/cqrs'
import type { Category } from '@prisma/client'
import { GetCategoriesByUserQuery } from '../get-categories-by-user.query'
import { CategoryRepository } from '../../repositories/category.repository'

@QueryHandler(GetCategoriesByUserQuery)
export class GetCategoriesByUserHandler implements IQueryHandler<
  GetCategoriesByUserQuery,
  Category[]
> {
  constructor(private readonly categoryRepo: CategoryRepository) {}

  execute(query: GetCategoriesByUserQuery): Promise<Category[]> {
    return this.categoryRepo.findAllByUser(query.userId)
  }
}
