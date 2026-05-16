import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { UserRepository } from './repositories/user.repository'
import { CreateUserHandler } from './commands/handlers/create-user.handler'
import { UpdateRefreshTokenHashHandler } from './commands/handlers/update-refresh-token-hash.handler'
import { GetUserByEmailHandler } from './queries/handlers/get-user-by-email.handler'
import { GetUserByIdHandler } from './queries/handlers/get-user-by-id.handler'

@Module({
  imports: [CqrsModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserRepository,
    CreateUserHandler,
    UpdateRefreshTokenHashHandler,
    GetUserByEmailHandler,
    GetUserByIdHandler,
  ],
  exports: [UsersService, GetUserByIdHandler],
})
export class UsersModule {}
