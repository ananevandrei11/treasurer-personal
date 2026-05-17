import { fetchWithAuth } from '@/shared/api'
import type { ListTransactionsParams, ListTransactionsResponse } from '@/shared/api'

export async function getTransactions(params: ListTransactionsParams = {}): Promise<ListTransactionsResponse> {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.month) qs.set('month', String(params.month))
  if (params.year) qs.set('year', String(params.year))
  const query = qs.toString()
  return fetchWithAuth<ListTransactionsResponse>(`/transactions${query ? `?${query}` : ''}`)
}
