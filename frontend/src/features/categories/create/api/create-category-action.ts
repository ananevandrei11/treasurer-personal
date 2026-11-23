'use server'

import { revalidatePath } from 'next/cache'
import { fetchWithAuth, ApiError } from '@/shared/api'
import { createCategorySchema } from '../model/create-category'

export type CreateCategoryState = {
  fieldErrors: Partial<Record<'name' | 'color', string[]>>
  formError: string | null
  success: boolean
}

const initialState: CreateCategoryState = { fieldErrors: {}, formError: null, success: false }

export async function createCategoryAction(
  _prev: CreateCategoryState,
  formData: FormData,
): Promise<CreateCategoryState> {
  const raw = {
    name: formData.get('name'),
    color: formData.get('color'),
  }

  const parsed = createCategorySchema.safeParse(raw)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, formError: null, success: false }
  }

  try {
    await fetchWithAuth('/categories', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    })
  } catch (err) {
    if (err instanceof ApiError) {
      return { ...initialState, formError: `Server error: ${err.message}` }
    }
    return { ...initialState, formError: 'Something went wrong. Please try again.' }
  }

  revalidatePath('/dashboard/categories')
  return { fieldErrors: {}, formError: null, success: true }
}
