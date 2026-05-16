import { Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { createHash } from 'crypto'
import type { User } from '@prisma/client'
import { UserRepository } from './repositories/user.repository'

@Injectable()
export class UsersService {
  constructor(private readonly userRepo: UserRepository) {}

  findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findByEmail(email)
  }

  findById(id: string): Promise<User | null> {
    return this.userRepo.findById(id)
  }

  async create(email: string, name: string, password: string): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10)
    return this.userRepo.create({ email, name, passwordHash })
  }

  async updateRefreshTokenHash(userId: string, refreshToken: string | null): Promise<void> {
    const hash =
      refreshToken !== null ? createHash('sha256').update(refreshToken).digest('hex') : null
    await this.userRepo.updateRefreshTokenHash(userId, hash)
  }
}
