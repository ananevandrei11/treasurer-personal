/**
 * Command to create a new user.
 * Dispatched by {@link AuthService.register}.
 */
export class CreateUserCommand {
  /**
   * @param email - User email.
   * @param name - User display name.
   * @param password - Raw password (will be hashed by service).
   */
  constructor(
    public readonly email: string,
    public readonly name: string,
    public readonly password: string,
  ) {}
}
