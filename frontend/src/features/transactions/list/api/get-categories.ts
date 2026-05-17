import { cache } from 'react'
import { fetchWithAuth } from '@/shared/api'
import type { Category } from '@/shared/api'

export const getCategories = cache(async function getCategories(): Promise<Category[]> {
  return fetchWithAuth<Category[]>('/categories')
})
