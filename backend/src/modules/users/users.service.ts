import { Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { createHash } from 'crypto'
import type { User } from '@prisma/client'
import { UserRepository } from './repositories/user.repository'

/**
 * Domain service for User management.
 * Handles hashing of passwords and tokens before persistence.
 */
@Injectable()
export class UsersService {
  constructor(private readonly userRepo: UserRepository) {}

  /**
   * Finds a user by email.
   *
   * @param email - User's unique email.
   * @returns The User entity or null if not found.
   */
  findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findByEmail(email)
  }

  /**
   * Finds a user by their UUID.
   *
   * @param id - User UUID.
   * @returns The User entity or null if not found.
   */
  findById(id: string): Promise<User | null> {
    return this.userRepo.findById(id)
  }

  /**
   * Hashes the password and creates a new user record.
   *
   * @param email - User's email.
   * @param name - User's display name.
   * @param password - Raw password to hash.
   * @returns The newly created User entity.
   */
  async create(email: string, name: string, password: string): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10)
    return this.userRepo.create({ email, name, passwordHash })
  }

  /**
   * Hashes a raw refresh token (if provided) and updates the user record.
   *
   * @param userId - User UUID.
   * @param refreshToken - Raw refresh token or null to clear.
   */
  async updateRefreshTokenHash(userId: string, refreshToken: string | null): Promise<void> {
    const hash =
      refreshToken !== null ? createHash('sha256').update(refreshToken).digest('hex') : null
    await this.userRepo.updateRefreshTokenHash(userId, hash)
  }
}
