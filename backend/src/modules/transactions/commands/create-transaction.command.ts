import type { TransactionType } from '@prisma/client'

/**
 * Command to create a new transaction for a user.
 * Dispatched by {@link TransactionsService.create}.
 */
export class CreateTransactionCommand {
  /**
   * @param userId - Owner user UUID.
   * @param amount - Decimal string (e.g. "12.50").
   * @param type - Transaction type: INCOME or EXPENSE.
   * @param date - Transaction date.
   * @param categoryId - Category UUID; must belong to the user.
   * @param description - Optional free-text note (max 500 chars).
   */
  constructor(
    public readonly userId: string,
    public readonly amount: string,
    public readonly type: TransactionType,
    public readonly date: Date,
    public readonly categoryId: string,
    public readonly description?: string,
  ) {}
}
