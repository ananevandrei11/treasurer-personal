import { Injectable } from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import type { Category } from '@prisma/client'
import { CreateCategoryCommand } from './commands/create-category.command'
import { UpdateCategoryCommand } from './commands/update-category.command'
import { DeleteCategoryCommand } from './commands/delete-category.command'
import { GetCategoriesByUserQuery } from './queries/get-categories-by-user.query'
import { GetCategoryByIdForUserQuery } from './queries/get-category-by-id-for-user.query'

@Injectable()
export class CategoriesService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  findAll(userId: string): Promise<Category[]> {
    return this.queryBus.execute(new GetCategoriesByUserQuery(userId))
  }

  findOne(id: string, userId: string): Promise<Category | null> {
    return this.queryBus.execute(new GetCategoryByIdForUserQuery(id, userId))
  }

  create(userId: string, name: string, color: string, icon: string): Promise<Category> {
    return this.commandBus.execute(new CreateCategoryCommand(userId, name, color, icon))
  }

  update(
    id: string,
    userId: string,
    name?: string,
    color?: string,
    icon?: string,
  ): Promise<Category> {
    return this.commandBus.execute(new UpdateCategoryCommand(id, userId, name, color, icon))
  }

  remove(id: string, userId: string): Promise<void> {
    return this.commandBus.execute(new DeleteCategoryCommand(id, userId))
  }
}
