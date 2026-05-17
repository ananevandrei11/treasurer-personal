import { getTransactions } from '../api/get-transactions'
import { getCategories } from '../api/get-categories'
import { TransactionItem } from './TransactionItem'
import { TransactionsPagination } from './TransactionsPagination'
import type { Category } from '@/shared/api'

type Props = { page: number }

export async function TransactionsList({ page }: Props) {
  const [data, categories] = await Promise.all([
    getTransactions({ page, limit: 10 }),
    getCategories(),
  ])

  const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]))

  if (data.transactions.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        No transactions yet. Add your first one!
      </div>
    )
  }

  return (
    <div>
      <div className="divide-y divide-border rounded-lg border border-border">
        {data.transactions.map((t) => (
          <TransactionItem key={t.id} transaction={t} category={categoryMap.get(t.categoryId)} />
        ))}
      </div>
      <TransactionsPagination pagination={data.pagination} />
    </div>
  )
}
