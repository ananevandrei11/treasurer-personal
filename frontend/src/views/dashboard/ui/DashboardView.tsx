import { Suspense } from 'react'
import { TransactionsList } from '@/features/transactions/list'
import { getCategories } from '@/features/categories/list'
import { AddTransactionTrigger } from '@/features/transactions/create'

type Props = { page: number }

export async function DashboardView({ page }: Props) {
  const categories = await getCategories()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Transactions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track your income and expenses</p>
        </div>
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
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-2xl bg-card px-5 py-4">
          <div className="size-10 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-36 rounded-full bg-muted animate-pulse" />
            <div className="h-2.5 w-24 rounded-full bg-muted animate-pulse" />
          </div>
          <div className="h-3.5 w-20 rounded-full bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  )
}
