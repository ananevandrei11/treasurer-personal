/**
 * Command to delete a transaction.
 * Dispatched by {@link TransactionsService.remove}.
 */
export class DeleteTransactionCommand {
  /**
   * @param id - Transaction UUID to delete.
   * @param userId - Owner user UUID (used for ownership check).
   */
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
