import type { ICommandHandler } from '@nestjs/cqrs'
import { CommandHandler } from '@nestjs/cqrs'
import type { User } from '@prisma/client'
import { CreateUserCommand } from '../create-user.command'
import { UsersService } from '../../users.service'

/**
 * Handles {@link CreateUserCommand}.
 * Delegates user creation to {@link UsersService}.
 */
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand, User> {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Executes the create-user command.
   *
   * @param command - Command containing email, name, and password.
   * @returns The newly created User entity.
   */
  execute(command: CreateUserCommand): Promise<User> {
    return this.usersService.create(command.email, command.name, command.password)
  }
}
