import type { ICommandHandler } from '@nestjs/cqrs'
import { CommandHandler } from '@nestjs/cqrs'
import { UpdateRefreshTokenHashCommand } from '../update-refresh-token-hash.command'
import { UsersService } from '../../users.service'

@CommandHandler(UpdateRefreshTokenHashCommand)
export class UpdateRefreshTokenHashHandler implements ICommandHandler<
  UpdateRefreshTokenHashCommand,
  void
> {
  constructor(private readonly usersService: UsersService) {}

  execute(command: UpdateRefreshTokenHashCommand): Promise<void> {
    return this.usersService.updateRefreshTokenHash(command.userId, command.refreshToken)
  }
}
