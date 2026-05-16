import type { ICommandHandler } from '@nestjs/cqrs'
import { CommandHandler } from '@nestjs/cqrs'
import type { User } from '@prisma/client'
import { CreateUserCommand } from '../create-user.command'
import { UsersService } from '../../users.service'

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand, User> {
  constructor(private readonly usersService: UsersService) {}

  execute(command: CreateUserCommand): Promise<User> {
    return this.usersService.create(command.email, command.name, command.password)
  }
}
