import { ApiProperty } from '@nestjs/swagger'

/**
 * Response DTO for a single category.
 */
export class CategoryDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string

  @ApiProperty({ example: 'Food & Drinks' })
  name!: string

  @ApiProperty({ example: '#FF5733' })
  color!: string

  @ApiProperty()
  createdAt!: Date

  @ApiProperty()
  updatedAt!: Date

  /**
   * Maps a Prisma Category entity to a CategoryDto.
   *
   * @param category - The raw Prisma Category row.
   * @returns A new CategoryDto.
   */
  static fromEntity(category: {
    id: string
    name: string
    color: string
    createdAt: Date
    updatedAt: Date
  }): CategoryDto {
    const dto = new CategoryDto()
    dto.id = category.id
    dto.name = category.name
    dto.color = category.color
    dto.createdAt = category.createdAt
    dto.updatedAt = category.updatedAt
    return dto
  }
}
