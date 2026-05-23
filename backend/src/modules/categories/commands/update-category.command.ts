/**
 * Command to partially update an existing category.
 * Dispatched by {@link CategoriesService.update}.
 */
export class UpdateCategoryCommand {
  /**
   * @param id - Category UUID to update.
   * @param userId - Owner user UUID (used for ownership check).
   * @param name - New category display name.
   * @param color - New hex color string.
   * @param icon - New icon identifier string.
   */
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly name?: string,
    public readonly color?: string,
  ) {}
}
