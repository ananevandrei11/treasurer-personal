import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { CategoriesController } from './categories.controller'
import { CategoriesService } from './categories.service'
import { CategoryRepository } from './repositories/category.repository'
import { CreateCategoryHandler } from './commands/handlers/create-category.handler'
import { UpdateCategoryHandler } from './commands/handlers/update-category.handler'
import { DeleteCategoryHandler } from './commands/handlers/delete-category.handler'
import { GetCategoriesByUserHandler } from './queries/handlers/get-categories-by-user.handler'
import { GetCategoryByIdForUserHandler } from './queries/handlers/get-category-by-id-for-user.handler'
import { UsersModule } from '../users/users.module'

@Module({
  imports: [CqrsModule, UsersModule],
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    CategoryRepository,
    CreateCategoryHandler,
    UpdateCategoryHandler,
    DeleteCategoryHandler,
    GetCategoriesByUserHandler,
    GetCategoryByIdForUserHandler,
  ],
})
export class CategoriesModule {}
