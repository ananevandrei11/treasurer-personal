import { backendFetch } from '@/shared/api'
import type { ListTransactionsParams, ListTransactionsResponse } from '@/shared/api'
import { getAccessToken } from '@/shared/lib'

export async function getTransactions(params: ListTransactionsParams = {}): Promise<ListTransactionsResponse> {
  const token = await getAccessToken()
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.month) qs.set('month', String(params.month))
  if (params.year) qs.set('year', String(params.year))
  const query = qs.toString()
  return backendFetch<ListTransactionsResponse>(`/transactions${query ? `?${query}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}
