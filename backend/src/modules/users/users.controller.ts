import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { QueryBus } from '@nestjs/cqrs'
import { GetUserByIdQuery } from './queries/get-user-by-id.query'
import { UserDto } from './dto/user.dto'
import type { User } from '@prisma/client'
import { CurrentUser } from '../../common/current-user.decorator'
import type { JwtUser } from '../../common/current-user.decorator'

@Controller('users')
export class UsersController {
  constructor(private readonly queryBus: QueryBus) {}

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
