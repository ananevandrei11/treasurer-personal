import { TransactionDto } from './transaction.dto'
import { TransactionSummaryDto } from './transaction-summary.dto'

export class ListTransactionsDto {
  transactions!: TransactionDto[]
  summary!: TransactionSummaryDto
}
