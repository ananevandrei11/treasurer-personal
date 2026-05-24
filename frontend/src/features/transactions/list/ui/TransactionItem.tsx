import type { Transaction } from '@/shared/api'
import type { Category } from '@/shared/api'
import { cn } from '@/shared/lib'

type Props = {
  transaction: Transaction
  category: Category | undefined
}

export function TransactionItem({ transaction, category }: Props) {
  const isIncome = transaction.type === 'INCOME'
  const date = new Date(transaction.date).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(transaction.amount))

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-card px-5 py-4 hover:shadow-sm transition-shadow">
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: category ? `${category.color}22` : 'var(--color-muted)',
        }}
      >
        <span
          className="size-3 rounded-full"
          style={{ backgroundColor: category?.color ?? 'var(--color-muted-foreground)' }}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {transaction.description ?? category?.name ?? '—'}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {date}
          {category && ` · ${category.name}`}
        </p>
      </div>

      <span
        className={cn(
          'shrink-0 text-sm font-bold tabular-nums',
          isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400',
        )}
      >
        {isIncome ? '+' : '−'}{formattedAmount}
      </span>
    </div>
  )
}
