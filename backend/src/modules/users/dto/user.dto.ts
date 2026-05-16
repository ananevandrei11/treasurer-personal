export class UserDto {
  id!: string
  email!: string
  name!: string
  createdAt!: Date
  updatedAt!: Date

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
