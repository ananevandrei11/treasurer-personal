import { TransactionDto } from './transaction.dto'
import { TransactionSummaryDto } from './transaction-summary.dto'

export class PaginationDto {
  page!: number
  limit!: number
  total!: number
  totalPages!: number
}

export class ListTransactionsDto {
  transactions!: TransactionDto[]
  summary!: TransactionSummaryDto
  pagination!: PaginationDto
}
