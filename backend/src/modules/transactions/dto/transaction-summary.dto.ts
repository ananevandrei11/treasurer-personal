/** Aggregate income/expense summary for a transaction list response. All monetary values are decimal strings. */
export class TransactionSummaryDto {
  totalIncome!: string
  totalExpense!: string
  balance!: string
  count!: number
}
