import type { IQueryHandler } from '@nestjs/cqrs'
import { QueryHandler } from '@nestjs/cqrs'
import type { User } from '@prisma/client'
import { GetUserByIdQuery } from '../get-user-by-id.query'
import { UsersService } from '../../users.service'

/**
 * Handles {@link GetUserByIdQuery}.
 * Delegates lookup to {@link UsersService}.
 */
@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery, User | null> {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Executes the get-user-by-id query.
   *
   * @param query - Query containing the user UUID to search for.
   * @returns The User entity or null.
   */
  execute(query: GetUserByIdQuery): Promise<User | null> {
    return this.usersService.findById(query.userId)
  }
}
