import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { QueryBus } from '@nestjs/cqrs'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GetUserByIdQuery } from './queries/get-user-by-id.query'
import { UserDto } from './dto/user.dto'
import type { User } from '@prisma/client'
import { CurrentUser } from '../../common/current-user.decorator'
import type { JwtUser } from '../../common/current-user.decorator'

/**
 * REST controller for managing user profiles.
 */
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly queryBus: QueryBus) {}

  /**
   * Returns the profile of the currently authenticated user.
   *
   * @param user - Populated from the jwt guard.
   * @returns The authenticated user's profile.
   * @throws {NotFoundException} If the user record is not found in the database.
   */
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile found.', type: UserDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getMe(@CurrentUser() user: JwtUser): Promise<UserDto> {
    const found = await this.queryBus.execute<GetUserByIdQuery, User | null>(
      new GetUserByIdQuery(user.userId),
    )
    if (!found) throw new NotFoundException('User not found')
    return UserDto.fromEntity(found)
  }
}
