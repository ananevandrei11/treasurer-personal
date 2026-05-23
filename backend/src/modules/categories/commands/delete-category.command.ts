/**
 * Command to delete a category.
 * Dispatched by {@link CategoriesService.remove}.
 */
export class DeleteCategoryCommand {
  /**
   * @param id - Category UUID to delete.
   * @param userId - Owner user UUID (used for ownership check).
   */
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
