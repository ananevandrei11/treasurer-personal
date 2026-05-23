import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import type { User } from '@prisma/client'

/**
 * Prisma-backed repository for the User aggregate.
 */
@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds a user by email.
   *
   * @param email - User's email address.
   * @returns Prisma User entity or null.
   */
  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } })
  }

  /**
   * Finds a user by ID.
   *
   * @param id - User UUID.
   * @returns Prisma User entity or null.
   */
  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } })
  }

  /**
   * Persists a new user record.
   *
   * @param data - User data including hashed password.
   * @returns The created Prisma User entity.
   */
  create(data: { email: string; name: string; passwordHash: string }): Promise<User> {
    return this.prisma.user.create({ data })
  }

  /**
   * Updates the refresh token hash for a user.
   *
   * @param id - User UUID.
   * @param hash - Hashed refresh token or null.
   */
  async updateRefreshTokenHash(id: string, hash: string | null): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { refreshTokenHash: hash } })
  }
}
