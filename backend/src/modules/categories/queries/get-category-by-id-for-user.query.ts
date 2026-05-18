/**
 * Query to retrieve a single category by ID, scoped to a user.
 * Dispatched by {@link CategoriesService.findOne}.
 */
export class GetCategoryByIdForUserQuery {
  /**
   * @param id - Category UUID.
   * @param userId - Owner user UUID.
   */
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
