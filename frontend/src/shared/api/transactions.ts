export type TransactionType = 'INCOME' | 'EXPENSE'

export type Transaction = {
  id: string
  amount: string
  type: TransactionType
  description: string | null
  date: string
  categoryId: string
  userId: string
  createdAt: string
  updatedAt: string
}

export type TransactionsSummary = {
  totalIncome: string
  totalExpense: string
  balance: string
  count: number
}

export type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type ListTransactionsResponse = {
  transactions: Transaction[]
  summary: TransactionsSummary
  pagination: Pagination
}

export type ListTransactionsParams = {
  page?: number
  limit?: number
  month?: number
  year?: number
}
