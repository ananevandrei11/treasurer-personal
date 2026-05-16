import { Controller, Get, NotFoundException, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { QueryBus } from '@nestjs/cqrs'
import type { Request } from 'express'
import { GetUserByIdQuery } from './queries/get-user-by-id.query'
import { UserDto } from './dto/user.dto'
import type { User } from '@prisma/client'

interface JwtUser {
  userId: string
  email: string
}

@Controller('users')
export class UsersController {
  constructor(private readonly queryBus: QueryBus) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getMe(@Req() req: Request): Promise<UserDto> {
    const { userId } = req.user as JwtUser
    const user = await this.queryBus.execute<GetUserByIdQuery, User | null>(
      new GetUserByIdQuery(userId),
    )
    if (!user) throw new NotFoundException('User not found')
    return UserDto.fromEntity(user)
  }
}
