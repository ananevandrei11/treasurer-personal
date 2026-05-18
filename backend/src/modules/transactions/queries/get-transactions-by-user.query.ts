/**
 * Query to retrieve a paginated list of transactions for a user.
 * Dispatched by {@link TransactionsService.findAll}.
 */
export class GetTransactionsByUserQuery {
  /**
   * @param userId - Owner user UUID.
   * @param month - Optional calendar month (1–12); must be paired with `year`.
   * @param year - Optional calendar year; must be paired with `month`.
   * @param page - Page number (1-based), defaults to 1.
   * @param limit - Page size, defaults to 10.
   */
  constructor(
    public readonly userId: string,
    public readonly month?: number,
    public readonly year?: number,
    public readonly page: number = 1,
    public readonly limit: number = 10,
  ) {}
}
