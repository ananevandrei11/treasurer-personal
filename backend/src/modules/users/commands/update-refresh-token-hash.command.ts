/**
 * Command to update the stored refresh token hash for a user.
 * Dispatched by {@link AuthService} during login, register, and refresh.
 */
export class UpdateRefreshTokenHashCommand {
  /**
   * @param userId - User UUID.
   * @param refreshToken - Raw refresh token (will be hashed) or null.
   */
  constructor(
    public readonly userId: string,
    public readonly refreshToken: string | null,
  ) {}
}
