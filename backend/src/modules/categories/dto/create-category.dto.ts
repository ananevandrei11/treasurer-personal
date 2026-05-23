import { ApiProperty } from '@nestjs/swagger'
import { IsString, MinLength, MaxLength, Matches } from 'class-validator'

/** Input DTO for creating a new category. */
export class CreateCategoryDto {
  @ApiProperty({ example: 'Food & Drinks', minLength: 1, maxLength: 50 })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name!: string

  @ApiProperty({ example: '#FF5733', description: 'Hex color string' })
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  color!: string

  @ApiProperty({ example: 'utensils', minLength: 1, maxLength: 50 })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  icon!: string
}
