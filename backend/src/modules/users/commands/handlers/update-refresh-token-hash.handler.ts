import type { ICommandHandler } from '@nestjs/cqrs'
import { CommandHandler } from '@nestjs/cqrs'
import { UpdateRefreshTokenHashCommand } from '../update-refresh-token-hash.command'
import { UsersService } from '../../users.service'

/**
 * Handles {@link UpdateRefreshTokenHashCommand}.
 * Delegates token hashing and update to {@link UsersService}.
 */
@CommandHandler(UpdateRefreshTokenHashCommand)
export class UpdateRefreshTokenHashHandler
  implements ICommandHandler<UpdateRefreshTokenHashCommand, void>
{
  constructor(private readonly usersService: UsersService) {}

  /**
   * Executes the update-refresh-token-hash command.
   *
   * @param command - Command containing userId and raw refresh token (or null).
   */
  execute(command: UpdateRefreshTokenHashCommand): Promise<void> {
    return this.usersService.updateRefreshTokenHash(command.userId, command.refreshToken)
  }
}
