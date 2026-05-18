/**
 * Query to find a user by their email address.
 * Dispatched by {@link AuthService}.
 */
export class GetUserByEmailQuery {
  /**
   * @param email - User's email.
   */
  constructor(public readonly email: string) {}
}
