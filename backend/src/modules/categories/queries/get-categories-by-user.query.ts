/**
 * Query to retrieve all categories for a user.
 * Dispatched by {@link CategoriesService.findAll}.
 */
export class GetCategoriesByUserQuery {
  /**
   * @param userId - Owner user UUID.
   */
  constructor(public readonly userId: string) {}
}
