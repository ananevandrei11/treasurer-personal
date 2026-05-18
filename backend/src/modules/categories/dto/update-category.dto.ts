import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator'

/** Input DTO for partially updating an existing category. All fields are optional. */
export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Food & Drinks', minLength: 1, maxLength: 50 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string

  @ApiPropertyOptional({ example: '#FF5733', description: 'Hex color string' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  color?: string

  @ApiPropertyOptional({ example: 'utensils', minLength: 1, maxLength: 50 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  icon?: string
}
