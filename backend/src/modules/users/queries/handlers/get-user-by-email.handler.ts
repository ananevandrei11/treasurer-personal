import type { IQueryHandler } from '@nestjs/cqrs'
import { QueryHandler } from '@nestjs/cqrs'
import type { User } from '@prisma/client'
import { GetUserByEmailQuery } from '../get-user-by-email.query'
import { UsersService } from '../../users.service'

/**
 * Handles {@link GetUserByEmailQuery}.
 * Delegates lookup to {@link UsersService}.
 */
@QueryHandler(GetUserByEmailQuery)
export class GetUserByEmailHandler implements IQueryHandler<GetUserByEmailQuery, User | null> {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Executes the get-user-by-email query.
   *
   * @param query - Query containing the email to search for.
   * @returns The User entity or null.
   */
  execute(query: GetUserByEmailQuery): Promise<User | null> {
    return this.usersService.findByEmail(query.email)
  }
}
