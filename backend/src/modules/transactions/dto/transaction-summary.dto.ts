import { ApiProperty } from '@nestjs/swagger'

/** Aggregate income/expense summary for a transaction list response. All monetary values are decimal strings. */
export class TransactionSummaryDto {
  @ApiProperty({ example: '1000.00' })
  totalIncome!: string

  @ApiProperty({ example: '150.50' })
  totalExpense!: string

  @ApiProperty({ example: '849.50' })
  balance!: string

  @ApiProperty({ example: 3 })
  count!: number
}
