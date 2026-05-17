export class CategoryDto {
  id!: string
  name!: string
  color!: string
  icon!: string
  createdAt!: Date
  updatedAt!: Date

  static fromEntity(category: {
    id: string
    name: string
    color: string
    icon: string
    createdAt: Date
    updatedAt: Date
  }): CategoryDto {
    const dto = new CategoryDto()
    dto.id = category.id
    dto.name = category.name
    dto.color = category.color
    dto.icon = category.icon
    dto.createdAt = category.createdAt
    dto.updatedAt = category.updatedAt
    return dto
  }
}
