import { IsOptional, IsInt, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

export class ListTransactionsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1970)
  @Max(2100)
  year?: number
}
