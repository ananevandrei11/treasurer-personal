/**
 * Query to find a user by their UUID.
 * Dispatched by {@link UsersController} and {@link AuthService}.
 */
export class GetUserByIdQuery {
  /**
   * @param userId - User UUID.
   */
  constructor(public readonly userId: string) {}
}
