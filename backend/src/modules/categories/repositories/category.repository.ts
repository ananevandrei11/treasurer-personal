import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import type { Category } from '@prisma/client'

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { name: string; color: string; icon: string; userId: string }): Promise<Category> {
    return this.prisma.category.create({ data })
  }

  findAllByUser(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({ where: { userId } })
  }

  findByIdForUser(id: string, userId: string): Promise<Category | null> {
    return this.prisma.category.findFirst({ where: { id, userId } })
  }

  update(
    id: string,
    userId: string,
    data: { name?: string; color?: string; icon?: string },
  ): Promise<Category> {
    return this.prisma.category.update({ where: { id, userId }, data })
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.category.delete({ where: { id, userId } })
  }
}
