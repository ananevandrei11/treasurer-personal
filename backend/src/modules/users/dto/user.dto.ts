import { ApiProperty } from '@nestjs/swagger'

/** Response DTO for a user profile. */
export class UserDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string

  @ApiProperty({ example: 'user@example.com' })
  email!: string

  @ApiProperty({ example: 'John Doe' })
  name!: string

  @ApiProperty()
  createdAt!: Date

  @ApiProperty()
  updatedAt!: Date

  /**
   * Maps a Prisma User entity to a UserDto.
   *
   * @param user - The raw Prisma User row.
   * @returns A new UserDto.
   */
  static fromEntity(user: {
    id: string
    email: string
    name: string
    createdAt: Date
    updatedAt: Date
  }): UserDto {
    const dto = new UserDto()
    dto.id = user.id
    dto.email = user.email
    dto.name = user.name
    dto.createdAt = user.createdAt
    dto.updatedAt = user.updatedAt
    return dto
  }
}
