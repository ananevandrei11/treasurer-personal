import { getCategories } from '@/features/categories/list'
import { AddCategoryTrigger } from '@/features/categories/create'

export async function CategoriesView() {
  const categories = await getCategories()

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Categories</h1>
        <AddCategoryTrigger />
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">No categories yet. Create one to get started.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center gap-3 px-4 py-3">
              <span
                className="size-4 shrink-0 rounded-full"
                style={{ backgroundColor: category.color }}
                aria-label={category.color}
              />
              <span className="flex-1 text-sm font-medium">{category.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
