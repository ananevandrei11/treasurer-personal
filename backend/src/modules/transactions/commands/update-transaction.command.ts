import type { TransactionType } from '@prisma/client'

/**
 * Command to partially update an existing transaction.
 * Dispatched by {@link TransactionsService.update}.
 */
export class UpdateTransactionCommand {
  /**
   * @param id - Transaction UUID to update.
   * @param userId - Owner user UUID (used for ownership check).
   * @param amount - New decimal amount string.
   * @param type - New transaction type.
   * @param date - New transaction date.
   * @param categoryId - New category UUID; must belong to the user.
   * @param description - New free-text note.
   */
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly amount?: string,
    public readonly type?: TransactionType,
    public readonly date?: Date,
    public readonly categoryId?: string,
    public readonly description?: string,
  ) {}
}
