/**
 * Query to retrieve a single transaction by ID, scoped to a user.
 * Dispatched by {@link TransactionsService.findOne}.
 */
export class GetTransactionByIdForUserQuery {
  /**
   * @param id - Transaction UUID.
   * @param userId - Owner user UUID.
   */
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
