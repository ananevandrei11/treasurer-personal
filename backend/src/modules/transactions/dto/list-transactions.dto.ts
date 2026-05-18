import { TransactionDto } from './transaction.dto'
import { TransactionSummaryDto } from './transaction-summary.dto'

/** Pagination metadata returned alongside a list response. */
export class PaginationDto {
  page!: number
  limit!: number
  total!: number
  totalPages!: number
}

/** Paginated transaction list response with aggregate income/expense summary. */
export class ListTransactionsDto {
  transactions!: TransactionDto[]
  summary!: TransactionSummaryDto
  pagination!: PaginationDto
}
