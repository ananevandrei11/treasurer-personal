import { getTransactions } from '../api/get-transactions'
import { getCategories } from '@/features/categories/list'
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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
        <p className="text-sm font-medium text-muted-foreground">No transactions yet.</p>
        <p className="mt-1 text-xs text-muted-foreground/70">Add your first one!</p>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-2">
        {data.transactions.map((t) => (
          <TransactionItem key={t.id} transaction={t} category={categoryMap.get(t.categoryId)} />
        ))}
      </div>
      <TransactionsPagination pagination={data.pagination} />
    </div>
  )
}
