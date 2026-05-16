import type { IQueryHandler } from '@nestjs/cqrs'
import { QueryHandler } from '@nestjs/cqrs'
import type { User } from '@prisma/client'
import { GetUserByEmailQuery } from '../get-user-by-email.query'
import { UsersService } from '../../users.service'

@QueryHandler(GetUserByEmailQuery)
export class GetUserByEmailHandler implements IQueryHandler<GetUserByEmailQuery, User | null> {
  constructor(private readonly usersService: UsersService) {}

  execute(query: GetUserByEmailQuery): Promise<User | null> {
    return this.usersService.findByEmail(query.email)
  }
}
