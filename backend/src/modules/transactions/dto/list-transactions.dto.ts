import { ApiProperty } from '@nestjs/swagger'
import { TransactionDto } from './transaction.dto'
import { TransactionSummaryDto } from './transaction-summary.dto'

/** Pagination metadata returned alongside a list response. */
export class PaginationDto {
  @ApiProperty({ example: 1 })
  page!: number

  @ApiProperty({ example: 10 })
  limit!: number

  @ApiProperty({ example: 42 })
  total!: number

  @ApiProperty({ example: 5 })
  totalPages!: number
}

/** Paginated transaction list response with aggregate income/expense summary. */
export class ListTransactionsDto {
  @ApiProperty({ type: [TransactionDto] })
  transactions!: TransactionDto[]

  @ApiProperty({ type: TransactionSummaryDto })
  summary!: TransactionSummaryDto

  @ApiProperty({ type: PaginationDto })
  pagination!: PaginationDto
}
