import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator'

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  color?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  icon?: string
}
