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

  return (
    <div className="flex items-center gap-3 py-3 px-4 hover:bg-muted/50 transition-colors rounded-lg">
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-sm"
        style={{ backgroundColor: category ? `${category.color}20` : undefined }}
      >
        {category?.icon ?? '💳'}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {transaction.description ?? category?.name ?? '—'}
        </p>
        <p className="text-xs text-muted-foreground">
          {date}
          {category && ` · ${category.name}`}
        </p>
      </div>

      <span
        className={cn(
          'shrink-0 text-sm font-semibold tabular-nums',
          isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
        )}
      >
        {isIncome ? '+' : '−'}
      {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
        Number(transaction.amount),
      )}
      </span>
    </div>
  )
}
