/**
 * Command to create a new category for a user.
 * Dispatched by {@link CategoriesService.create}.
 */
export class CreateCategoryCommand {
  /**
   * @param userId - Owner user UUID.
   * @param name - Category display name.
   * @param color - Hex color string.
   * @param icon - Icon identifier string.
   */
  constructor(
    public readonly userId: string,
    public readonly name: string,
    public readonly color: string,
    public readonly icon: string,
  ) {}
}
