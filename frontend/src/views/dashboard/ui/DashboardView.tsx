import { Suspense } from 'react'
import { TransactionsList, getCategories } from '@/features/transactions/list'
import { AddTransactionTrigger } from '@/features/transactions/create'

type Props = { page: number }

export async function DashboardView({ page }: Props) {
  const categories = await getCategories()

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Transactions</h1>
        <AddTransactionTrigger categories={categories} />
      </div>

      <Suspense fallback={<TransactionsListSkeleton />}>
        <TransactionsList page={page} />
      </Suspense>
    </div>
  )
}

function TransactionsListSkeleton() {
  return (
    <div className="divide-y divide-border rounded-lg border border-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="size-9 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-32 rounded bg-muted animate-pulse" />
            <div className="h-2.5 w-20 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-3 w-16 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  )
}
